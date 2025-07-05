**Installation**

Install the project dependencies using npm:

```bash
npm install
```

**Set Up Environment Variables**

Create a new file named `.env.local` in the root of your project and add the following content:

```env
NEXT_PUBLIC_VAPI_WEB_TOKEN="623ffcc3-be4a-47d3-b976-89ae065b6043"
NEXT_PUBLIC_VAPI_WORKFLOW_ID="f8b5306a-3027-47f9-8e56-3f32c06bbbdc"
GOOGLE_GENERATIVE_AI_API_KEY= "AIzaSyDtM_BvaV5mjiNi5PxCk7aV7aJO8EHlbl8"
MONGODB_DB = "SyncUp"
MONGODB_URI="mongodb+srv://dbUser:userdb2004@syncup.6wum8dk.mongodb.net/SyncUp?retryWrites=true&w=majority&appName=SyncUp"
JWT_SECRET = "ARandomMessageThatYouCantGuess"
```

Replace the placeholder values with your actual **[MongoDB](https://www.mongodb.com/)**, **[Vapi](https://vapi.ai/?utm_source=youtube&utm_medium=video&utm_campaign=jsmastery_recruitingpractice&utm_content=paid_partner&utm_term=recruitingpractice)** credentials.

**Running the Project**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the project.

