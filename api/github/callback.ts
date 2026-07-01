export default async function handler(req: any, res: any) {
  const code = req.query.code;
  
  if (!code) {
    return res.status(400).send('Authentication code is missing.');
  }

  const clientId = import.meta.GITHUB_CLIENT_ID || import.meta.VITE_GITHUB_CLIENT_ID;
  const clientSecret = import.meta.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).send('GitHub Client ID or Client Secret not configured on backend.');
  }

  try {
    // 1. Exchange OAuth code for Access Token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code
      })
    });

    if (!tokenResponse.ok) {
      throw new Error(`GitHub token exchange failed: ${tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json() as any;
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error('No access token returned from GitHub');
    }

    // 2. Fetch authenticated user details to confirm login identity
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'User-Agent': 'CodeRunner-IDE'
      }
    });

    let githubUser = null;
    if (userResponse.ok) {
      githubUser = await userResponse.json();
    }

    // 3. Return lightweight HTML that closes the popup and transmits credentials safely
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authenticating with GitHub...</title>
          <style>
            body {
              background-color: #1e1e1e;
              color: #cccccc;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
            }
            .spinner {
              border: 3px solid rgba(255,255,255,0.1);
              width: 36px;
              height: 36px;
              border-radius: 50%;
              border-left-color: #007acc;
              animation: spin 1s linear infinite;
              margin-bottom: 20px;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="spinner"></div>
          <h3>GitHub Authentication Successful!</h3>
          <p>Syncing credentials with your IDE workspace... This window should close automatically.</p>
          <script>
            (function() {
              const credentials = {
                token: ${JSON.stringify(accessToken)},
                user: ${JSON.stringify(githubUser)}
              };
              
              if (window.opener) {
                // Safely transmit successful oauth details to Coderunner window
                window.opener.postMessage({ 
                  type: 'GITHUB_OAUTH_SUCCESS', 
                  data: credentials 
                }, '*');
                window.close();
              } else {
                // Fallback inside same window
                localStorage.setItem('coderunner_github_token', credentials.token);
                localStorage.setItem('coderunner_github_user', JSON.stringify(credentials.user));
                window.location.href = '/';
              }
            })();
          </script>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('GitHub OAuth Callback Error:', error);
    return res.status(500).send(`
      <html>
        <body style="background-color: #1e1e1e; color: #f87171; font-family: sans-serif; padding: 40px; text-align: center;">
          <h2>GitHub Authentication Failed</h2>
          <p>${error.message}</p>
          <button onclick="window.close()" style="background-color: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 20px;">Close Window</button>
        </body>
      </html>
    `);
  }
}
