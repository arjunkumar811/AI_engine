# 🚀 AI Website Builder

An intelligent, AI-powered website builder that transforms natural language descriptions into fully functional websites. Built with cutting-edge technologies including Claude AI, WebContainer, and modern React.

## ✨ Features

- **🤖 AI-Powered Generation**: Leverage Anthropic's Claude 3.5 Sonnet to generate complete websites from simple descriptions
- **🌐 In-Browser Development**: Full Node.js environment running directly in your browser using WebContainer technology
- **📝 Code Editor**: Professional Monaco Editor with syntax highlighting and intelligent code completion
- **👁️ Live Preview**: Real-time preview of generated websites with instant feedback
- **📁 File Management**: Complete file system management with intuitive file explorer
- **🎯 Smart Project Detection**: Automatically determines whether to create Node.js or React-based projects
- **⚡ Lightning Fast**: Vite-powered development with hot module replacement

## 🏗️ Architecture

### Frontend (React + TypeScript + Vite)
- **React 19** with TypeScript for type-safe development
- **Tailwind CSS** for beautiful, responsive styling
- **Monaco Editor** for professional code editing experience
- **WebContainer API** for in-browser Node.js runtime
- **React Router** for seamless navigation
- **Lucide React** for modern iconography

### Backend (Node.js + Express)
- **Express.js** API server with TypeScript
- **Anthropic Claude AI** integration for intelligent code generation
- **CORS** enabled for cross-origin requests
- **Environment-based configuration** for secure API key management

## 🚦 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Anthropic API Key** ([Get one here](https://console.anthropic.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/arjunkumar811/AI_engine.git
   cd AI_engine
   ```

2. **Set up the Backend**
   ```bash
   cd backend
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the backend directory:
   ```env
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   ```

4. **Set up the Frontend**
   ```bash
   cd ../frontend
   npm install
   ```

5. **Install Tailwind CSS Dependencies** (if not already installed)
   ```bash
   npm install -D @tailwindcss/postcss autoprefixer
   ```

### Running the Application

1. **Start the Backend Server**
   ```bash
   cd backend
   npm run dev
   ```
   The backend will run on `http://localhost:3000`

2. **Start the Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will run on `http://localhost:5173` (or the next available port)

3. **Open your browser** and navigate to the frontend URL to start building!

## 🎯 How to Use

1. **Describe Your Vision**: Enter a detailed description of the website you want to create
   - Example: *"Create a modern portfolio website with a hero section, about me, skills showcase, and contact form"*

2. **AI Analysis**: The system analyzes your request and determines the best project type (React or Node.js)

3. **Step-by-Step Generation**: Watch as the AI creates a detailed build plan with individual steps

4. **Code Generation**: The AI generates complete, production-ready code files

5. **Live Preview**: See your website come to life in the integrated preview panel

6. **Iterate and Refine**: Make changes or request modifications to perfect your website

## 🛠️ Technology Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | Frontend Framework | 19.x |
| **TypeScript** | Type Safety | 5.x |
| **Vite** | Build Tool | 6.x |
| **Tailwind CSS** | Styling | 3.x |
| **Monaco Editor** | Code Editor | 4.x |
| **WebContainer** | Browser Runtime | 1.x |
| **Node.js** | Backend Runtime | 18+ |
| **Express** | Web Framework | 5.x |
| **Anthropic Claude** | AI Model | 3.5 Sonnet |

## 📂 Project Structure

```
AI-Engine/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── index.ts        # Main server file
│   │   ├── prompts.ts      # AI prompt configurations
│   │   ├── constants.ts    # Application constants
│   │   └── defaults/       # Project templates
│   ├── package.json
│   └── .env               # Environment variables
│
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── hooks/         # Custom React hooks
│   │   ├── types/         # TypeScript type definitions
│   │   └── config.ts      # Frontend configuration
│   ├── package.json
│   ├── tailwind.config.js # Tailwind configuration
│   └── vite.config.ts     # Vite configuration
│
└── README.md             # This file
```

## 🚀 Deployment

### Frontend Deployment

#### Vercel (Recommended)
```bash
cd frontend
npm run build
# Deploy dist/ folder to Vercel
```

#### Netlify
```bash
cd frontend
npm run build
# Drag and drop dist/ folder to Netlify
```

### Backend Deployment

#### Railway
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push

#### Render
1. Connect repository to Render
2. Configure environment variables
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key for Claude access | ✅ |

### Customization

- **AI Prompts**: Modify `backend/src/prompts.ts` to customize AI behavior
- **Project Templates**: Edit files in `backend/src/defaults/` to change default project structures
- **Styling**: Customize `frontend/tailwind.config.js` for design system changes

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/arjunkumar811/AI_engine/issues) page
2. Create a new issue with detailed description
3. Join our community discussions

## 🙏 Acknowledgments

- **Anthropic** for providing Claude AI capabilities
- **Stackblitz** for WebContainer technology
- **Vercel** for Vite and deployment platform
- **Tailwind Labs** for the amazing CSS framework

---

**Built with ❤️ by [Arjun Kumar](https://github.com/arjunkumar811)**

*Transform your ideas into reality with the power of AI* 🚀