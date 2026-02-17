<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1rK0ocheFcjvDqFaeqaa9S_ODEFpXwAgf

📖 **[Deutsche Dokumentation / German Documentation](README_DE.md)**

## Run Locally

**Prerequisites:**  Node.js

### Quick Start (Windows)

Simply double-click `start.bat` to automatically install dependencies and start the server on `http://localhost:3000`

### Manual Setup

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## New Features

- ✅ **Learning Progress Tracking**: All quiz results are saved locally
- 📊 **Exam Simulation Mode**: Realistic exam with 10 questions, time tracking, and detailed results
- 🎯 **Question Ordering**: Choose between random or sequential question order
- 📈 **Progress Dashboard**: View your statistics, success rate, and module-wise progress
- ✔️ **Answer History**: See all your correct and incorrect answers
