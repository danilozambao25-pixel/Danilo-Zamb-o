
import { GoogleGenAI } from "@google/genai";

// Initialize GoogleGenAI using the process.env.API_KEY environment variable directly
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateIncidentSummary(type: string, description: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `O motorista relatou o seguinte incidente em uma linha de ônibus: 
      Tipo: ${type}
      Descrição: ${description}
      
      Por favor, gere uma mensagem curta, educada e informativa para os passageiros que estão esperando no ponto, sugerindo o que eles devem fazer ou quanto tempo aproximado isso pode impactar. Responda em Português do Brasil de forma concisa.`,
    });
    // Correctly accessing text property from GenerateContentResponse
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Houve um imprevisto na linha. Recomendamos acompanhar o mapa para atualizações em tempo real.";
  }
}

export async function checkRouteDeviation(currentPos: {lat: number, lng: number}, routePoints: {lat: number, lng: number}[]) {
  // Logic to calculate if current position is significantly far from the nearest point on route
  // We can also use Gemini to verify if the deviation is significant or just GPS noise
  try {
    const prompt = `Dada a posição atual do ônibus (${currentPos.lat}, ${currentPos.lng}) e os pontos planejados da rota: ${JSON.stringify(routePoints.slice(0, 10))}..., o ônibus está seguindo o caminho correto ou desviou? Responda apenas "NORMAL" ou "DESVIADO" e uma breve justificativa em uma frase.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    // Correctly accessing text property from GenerateContentResponse
    return response.text;
  } catch (error) {
    return "NORMAL";
  }
}
