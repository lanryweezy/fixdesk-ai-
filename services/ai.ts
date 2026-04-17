import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export async function analyzeTicket(description: string): Promise<{ priority: string; category: string }> {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `Analyze the following support ticket description and determine a priority and category.
    Description: "${description}"

    Respond with a JSON object containing "priority" and "category" fields.
    Priority should be one of: "Low", "Medium", "High", "Urgent".
    Category should be one of: "Hardware", "Software", "Network", "Account", "Other".
    `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();

    // Clean the response to ensure it's valid JSON
    const jsonText = text.replace(/```json\n/g, '').replace(/\n```/g, '');
    const analysis = JSON.parse(jsonText);

    return {
      priority: analysis.priority || 'Medium',
      category: analysis.category || 'Other',
    };
  } catch (error) {
    console.error('Error analyzing ticket:', error);
    // Return default values in case of an error
    return {
      priority: 'Medium',
      category: 'Other',
    };
  }
}