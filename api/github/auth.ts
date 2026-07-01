import { IncomingMessage, ServerResponse } from 'http';

export default function handler(req: any, res: any) {
  const clientId = import.meta.GITHUB_CLIENT_ID || import.meta.VITE_GITHUB_CLIENT_ID;
  const clientSecret = import.meta.GITHUB_CLIENT_SECRET;
  if (!clientId) {
    return res.status(400).json({ 
      error: 'GitHub Client ID not configured. Please set GITHUB_CLIENT_ID in your environment variables, or log in with a Personal Access Token.' 
    });
  }

  // Generate redirect URI dynamically based on request or default config
  const host = req.headers.host || 'localhost:3000';
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const redirectUri = `${protocol}://${host}/api/github/callback`;

  // We request 'repo' scope to enable cloning, committing, and pushing code securely
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo,user`;

  return res.status(200).json({ url: githubAuthUrl });
}
