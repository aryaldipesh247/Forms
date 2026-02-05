
# Forms Pro | Microsoft Forms Clone

A high-fidelity, professional-grade Microsoft Forms replica built with React, Tailwind CSS, and Google Gemini AI. This application allows users to create, manage, and analyze surveys with modern UI/UX and intelligent features.

## ✨ Features

- **AI Assistant**: Powered by Google Gemini (`gemini-3-pro-preview`), automatically generate survey questions based on a topic or suggest visual themes based on your form's content.
- **Dynamic Themes**: Support for static image backgrounds and "Live" video headers for a premium feel.
- **Draggable Components**: Draggable title and description blocks for flexible layout design.
- **Advanced Question Types**: Supports Multiple Choice, Text, Date, Ranking, and a unique "Double Ranking Box" for complex data entry.
- **Response Analytics**: Built-in dashboard with Recharts integration for visual data analysis.
- **Excel Integration**: Export response data directly to CSV format compatible with Microsoft Excel.
- **Recycle Bin**: Graceful deletion with a 30-day retention period for forms and data archives.

## 🚀 Deployment

### Deploy to Vercel

1. Push this repository to your **GitHub**.
2. Connect your repository to **Vercel**.
3. **Important**: Add an Environment Variable in Vercel:
   - Key: `GEMINI_API_KEY`
   - Value: `YOUR_GOOGLE_AI_STUDIO_API_KEY`
4. Deploy!

### Environment Variables

The app requires a Gemini API key to function. Locally, you can create a `.env.local` file:
```env
GEMINI_API_KEY=your_api_key_here
```

## 🛠️ Tech Stack

- **Framework**: React 19
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Charts**: Recharts
- **AI**: @google/genai (Gemini SDK)
- **Deployment**: Vercel / GitHub Pages

## 📦 Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

---
Designed and Developed by **AjD Group Of Company** | *Lead Designer: Dipesh Jung Aryal*
