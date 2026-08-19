import Property from '../models/Property.js';
import { logEvent } from '../utils/logger.js';

// @desc    Process natural language chat queries and return properties
// @route   POST /api/chatbot
export const handleChatQuery = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ reply: "Please ask me something!" });

    const lowerMsg = message.toLowerCase();
    let query = {};
    let queryExplanation = [];

    // NLP Extraction - Property Type
    if (lowerMsg.includes('house') || lowerMsg.includes('home')) { query.type = 'house'; queryExplanation.push('houses'); }
    else if (lowerMsg.includes('apartment') || lowerMsg.includes('flat')) { query.type = 'apartment'; queryExplanation.push('apartments'); }
    else if (lowerMsg.includes('land') || lowerMsg.includes('plot')) { query.type = 'land'; queryExplanation.push('land'); }

    // NLP Extraction - Price limits (e.g., "under 50k", "below $100000", "max 5m")
    const priceMatch = lowerMsg.match(/(?:under|below|max|less than|cheaper than)\s*(?:rs\.?|\$)?\s*(\d+)(k|m)?/i);
    if (priceMatch) {
      let amount = parseInt(priceMatch[1]);
      if (priceMatch[2] === 'k') amount *= 1000;
      if (priceMatch[2] === 'm') amount *= 1000000;
      query.price = { $lte: amount };
      queryExplanation.push(`under Rs.${amount.toLocaleString()}`);
    }

    // NLP Extraction - Bedrooms (e.g., "2 bedroom", "3 beds", "4-bed")
    const bedMatch = lowerMsg.match(/(\d+)\s*(?:-)?\s*(?:bed|bedroom)/i);
    if (bedMatch) {
      query.bedrooms = { $gte: parseInt(bedMatch[1]) };
      queryExplanation.push(`with at least ${bedMatch[1]} bedrooms`);
    }

    // NLP Extraction - Location (e.g., "near Colombo", "in Kandy")
    const locMatch = lowerMsg.match(/(?:near|in|around|at)\s+([a-zA-Z]+)/i);
    if (locMatch && !['a', 'the', 'my', 'any'].includes(locMatch[1])) {
      query['location.city'] = { $regex: locMatch[1], $options: 'i' };
      queryExplanation.push(`near ${locMatch[1]}`);
    }

    // NLP Extraction - Features (e.g., "parking")
    if (lowerMsg.includes('parking') || lowerMsg.includes('garage')) {
       query['valuationMetrics.parkingSpaces'] = { $gte: 1 };
       queryExplanation.push('with parking');
    }

    // Fallback if no parameters were understood
    if (Object.keys(query).length === 0) {
      return res.json({ 
        reply: "I'm a real estate AI assistant! Try asking me something specific like: 'Find me a 2-bedroom apartment under 50k near Colombo' or 'Show me houses with parking.'", 
        properties: [] 
      });
    }

    // Execute the dynamically built database query
    const properties = await Property.find(query).sort({ views: -1 }).limit(3);

    // Formulate a natural conversational response
    let reply = "";
    if (properties.length === 0) {
      reply = `I searched everywhere, but I couldn't find any ${queryExplanation.join(' ')} right now. Try adjusting your budget or location!`;
    } else {
      reply = `I found ${properties.length} propert${properties.length === 1 ? 'y' : 'ies'} perfectly matching your request for ${queryExplanation.join(' ')}. Here is what I found:`;
    }

    await logEvent('system', 'ai_chatbot_used', req.user?._id || null, null, { query: message, resultsFound: properties.length });

    res.json({ reply, properties });

  } catch (error) {
    console.error("Chatbot Engine Error:", error);
    await logEvent('system', 'ai_chatbot_error', req.user?._id || null, null, { error: error.message });
    res.status(500).json({ reply: "Oops, my AI circuits got crossed. Please try asking again.", properties: [] });
  }
};