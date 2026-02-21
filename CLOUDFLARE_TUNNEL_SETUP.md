# Cloudflare Tunnel Deployment Setup

This repository is configured to deploy using Cloudflare Tunnels, which provides secure, encrypted connections without exposing ports or requiring TLS certificate management.

## Prerequisites

1. A Cloudflare account with a domain added
2. Docker and Docker Compose installed on your deployment server
3. `cloudflared` CLI tool installed locally for initial setup

## Initial Setup

### 1. Install cloudflared CLI

**macOS:**
```bash
brew install cloudflared
```

**Linux:**
```bash
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

**Windows:**
Download from: https://github.com/cloudflare/cloudflared/releases

### 2. Authenticate with Cloudflare

```bash
cloudflared tunnel login
```

This opens a browser window to authorize cloudflared with your Cloudflare account.

### 3. Create a Tunnel

```bash
cloudflared tunnel create tl-thirteen
```

This command will:
- Create a new tunnel
- Generate a credentials JSON file
- Display the tunnel ID

**Important:** Save the tunnel ID and note the location of the credentials file (typically `~/.cloudflared/<TUNNEL_ID>.json`)

### 4. Configure the Tunnel

Create your tunnel configuration from the template:

```bash
cp cloudflare-tunnel.yml.template cloudflare-tunnel.yml
```

Edit `cloudflare-tunnel.yml` and replace placeholders:

```yaml
tunnel: <TUNNEL_ID>  # Replace with your tunnel ID from step 3
credentials-file: /etc/cloudflared/credentials.json

ingress:
  - hostname: <YOUR_DOMAIN>  # Replace with your domain (e.g., tl-thirteen.yourdomain.com)
    service: http://app:80
  - service: http_status:404
```

**Note:** `cloudflare-tunnel.yml` is in `.gitignore` and will not be committed to prevent exposing your tunnel ID and domain.

### 5. Copy Credentials File

Copy the credentials file generated in step 3 to your repository:

```bash
cp ~/.cloudflared/<TUNNEL_ID>.json ./cloudflared-credentials.json
```

**Security Note:** Add `cloudflared-credentials.json` to `.gitignore` to prevent committing secrets.

### 6. Create DNS Record

Route your domain to the tunnel:

```bash
cloudflared tunnel route dns tl-thirteen <YOUR_DOMAIN>
```

Replace `<YOUR_DOMAIN>` with your desired subdomain (e.g., `tl-thirteen.yourdomain.com`)

Alternatively, you can create the DNS record manually in the Cloudflare dashboard:
- Type: CNAME
- Name: Your subdomain (e.g., `tl-thirteen`)
- Target: `<TUNNEL_ID>.cfargotunnel.com`
- Proxy status: Proxied (orange cloud)

## Deployment

### Deploy with Docker Compose

```bash
# Build and start services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### Verify Deployment

1. Check that both services are running:
   ```bash
   docker compose ps
   ```

2. Check cloudflared logs:
   ```bash
   docker compose logs cloudflared
   ```

3. Visit your domain in a browser to verify the application is accessible.

## File Structure

- `cloudflare-tunnel.yml` - Tunnel configuration (ingress rules, hostname routing)
- `cloudflared-credentials.json` - Tunnel credentials (DO NOT COMMIT)
- `docker-compose.yml` - Updated to include cloudflared service
- `Dockerfile` - Builds the application
- `nginx.conf` - Nginx configuration for serving the SPA

## Security Considerations

1. **Never commit credentials:** Ensure `cloudflared-credentials.json` is in `.gitignore`
2. **Rotate credentials:** If credentials are exposed, delete and recreate the tunnel
3. **Access control:** Use Cloudflare Access to add authentication if needed
4. **Rate limiting:** Configure Cloudflare rate limiting rules in the dashboard

## Advantages Over Traditional Setup

- **No port forwarding:** Traffic flows through Cloudflare's edge network
- **No TLS certificate management:** Cloudflare handles TLS automatically
- **DDoS protection:** Built-in Cloudflare protection
- **Easy deployment:** No firewall configuration needed
- **Zero trust security:** Can integrate with Cloudflare Access

## Troubleshooting

### Tunnel won't connect

1. Verify credentials file is correctly mounted:
   ```bash
   docker compose exec cloudflared ls -l /etc/cloudflared/
   ```

2. Check cloudflared logs:
   ```bash
   docker compose logs cloudflared
   ```

3. Verify tunnel ID matches in both `cloudflare-tunnel.yml` and credentials file

### Application not accessible

1. Verify DNS record is correctly configured:
   ```bash
   dig <YOUR_DOMAIN>
   ```

2. Check that the app service is healthy:
   ```bash
   docker compose exec app curl http://localhost:80
   ```

3. Verify ingress rules in `cloudflare-tunnel.yml` match your domain

### Managing Tunnels

List all tunnels:
```bash
cloudflared tunnel list
```

Delete a tunnel:
```bash
cloudflared tunnel delete <TUNNEL_NAME_OR_ID>
```

## Additional Resources

- [Cloudflare Tunnel Documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Cloudflared GitHub](https://github.com/cloudflare/cloudflared)
