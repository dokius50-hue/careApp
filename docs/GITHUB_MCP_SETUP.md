# GitHub MCP in Cursor

The GitHub MCP server is already added to your Cursor config so you can use GitHub (repos, issues, PRs, code search) from the AI.

## One step: add your GitHub token

GitHub MCP uses a **Personal Access Token (PAT)**, not your account password.

1. **Create a PAT** (if you don’t have one):
  - Open: [https://github.comhere /settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new)
  - Note: e.g. `Cursor GitHub MCP`
  - Expiration: your choice (e.g. 90 days)
  - Scopes: enable at least **repo** (and **read:org** if you use org repos)
2. **Put the token in Cursor’s config**:
  - Open: `~/.cursor/mcp.json`
  - Find: `"Authorization": "Bearer YOUR_GITHUB_PAT"`
  - Replace `YOUR_GITHUB_PAT` with your new token (paste the token value only).
  - Save the file.
3. **Restart Cursor** so the MCP server reloads.

## Check it works

- **Settings → Tools & Integrations → MCP**: “github” should show a green dot.
- In chat/composer, try: *“List my GitHub repositories”*.

## Notes

- Your global config is at `~/.cursor/mcp.json` (Supabase + GitHub).
- Never commit your PAT or put it in repo files; keep it only in `~/.cursor/mcp.json`.

