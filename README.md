
# Forms PRO | Professional Survey Suite

A high-fidelity, professional-grade survey suite built with React 19, Tailwind CSS, and Google Gemini AI. Forms PRO enables users to create, manage, and analyze complex data collection projects with enterprise UI/UX and intelligent automation.

## ✨ Features

- **Forms PRO AI Assistant**: Powered by Google Gemini (`gemini-3-pro-preview`), automatically generate survey questions or suggest visual themes tailored to your project.
- **Dynamic Themes**: Support for static images and "Live" video background headers for a premium respondent experience.
- **Intelligent Layouts**: Draggable title and description blocks for flexible document design.
- **Advanced Data Types**: Supports Multiple Choice, Text, Date, Ranking, and the exclusive "Double Ranking Box" for multidimensional data entry.
- **Integrated Analytics**: Built-in dashboard with Recharts for instant visual insights.
- **Cloud Persistence**: Multi-device synchronization using Cloudinary as a global data store.
- **Excel Connectivity**: Export response data directly to CSV format for advanced spreadsheet analysis.

## 🚀 Deployment

### Deploy to Vercel

1. Push this repository to your **GitHub**.
2. Connect your repository to **Vercel**.
3. **Important**: Add an Environment Variable in Vercel:
   - Key: `GEMINI_API_KEY`
   - Value: `YOUR_GOOGLE_AI_STUDIO_API_KEY`
4. Deploy!

### Environment Variables

Forms PRO requires a Gemini API key for intelligent features.
```env
GEMINI_API_KEY=your_api_key_here
```

## 🛠️ Tech Stack

- **Framework**: React 19
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Charts**: Recharts
- **AI**: @google/genai (Gemini SDK)
- **Persistence**: Cloudinary / Local Storage

---
Designed and Developed by **AjD Group Of Company** | *Lead Designer: Dipesh Jung Aryal*