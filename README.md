# Picule Protocol Server

🚀 **Backend API server for Picule decentralized protocol**

Revolutionary value-backed NFTs with permanently locked liquidity that eliminates rug pulls and creates intrinsic NFT value.

## 🏗️ Architecture

- **Express.js** server with security middleware
- **The Graph** subgraph integration for blockchain data
- **React Query** compatible API endpoints
- **In-memory caching** with incremental updates
- **DDoS protection** with IP blacklisting
- **CORS security** with domain whitelisting

## 📦 Installation

```bash
# Clone repository
git clone https://github.com/Vantana1995/picule-protocol-server
cd picule-server

# Install dependencies
npm install

# Create configuration files
New-Item -ItemType File -Name "config/config.js"
New-Item -ItemType File -Name "middleware/cors.js"

# Create environment file
New-Item -ItemType File -Name ".env"
```

## ⚙️ Configuration

### Environment Variables (.env)

```env
# The Graph Subgraph
SUBGRAPH_URL=https://gateway.thegraph.com/api/YOUR_API_KEY/subgraphs/id/ExJ4cYqWhnWJyMd5N2gNU3QD21u8m6bYiBTERPnisWPN

# Server Settings
PORT=3001
NODE_ENV=production
LOG_LEVEL=info

```

### Security Configuration

Update `middleware/cors.js`:

1. **Replace IP addresses** with your actual IPs:

```javascript
// Your local development IP
"http://YOUR_LOCAL_IP:3000";

// Admin IP whitelist
const adminIPs = ["127.0.0.1", "::1", "localhost", "YOUR_IP_HERE"];
```

2. **Update allowed origins**:

```javascript
const allowedOrigins = ["https://picule.xyz"];
```

## 🚀 Running

### Development

```bash
npm run dev
# or
node index.js
```

### Production

```bash
npm start
```

Server will be available at `http://localhost:3001`

## 📡 API Endpoints

### Public Endpoints (Read-only)

- `GET /health` - Server health check
- `GET /api/ico-requests` - All ICO requests
- `GET /api/ico-requests?active=true` - Active ICOs only
- `GET /api/contributions` - All contributions
- `GET /api/projects` - All projects
- `GET /api/listings` - NFT marketplace listings
- `GET /api/sales` - NFT sales
- `GET /api/tokens` - DEX tokens
- `GET /api/pairs` - DEX pairs
- `GET /api/stats/global` - Global statistics
- `GET /api/stats/marketplace` - Marketplace statistics
- `GET /api/status` - Server and cache status

### Admin Endpoints (Restricted IP access)

- `POST /api/admin/refresh` - Force cache refresh
- `POST /api/admin/update` - Manual update trigger
- `GET /api/admin/whitelist` - View CORS whitelist

## 🛡️ Security Features

### Rate Limiting

- **Normal users**: 30 requests per minute
- **DDoS protection**: 20 requests per 30 seconds → 15min block
- **Permanent ban**: After 5 DDoS warnings

### IP Protection

- **Blacklist system**: Temporary and permanent bans
- **Admin whitelist**: Restricted access to admin endpoints
- **CORS protection**: Domain-based access control

### Security Headers

- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Content-Security-Policy: default-src 'none'

## 🔄 Data Flow

1. **Initial Load**: Fetches all data from The Graph subgraph
2. **Incremental Updates**: Every 10 seconds, checks for new blocks
3. **Smart Caching**: Only fetches new data when blockchain state changes
4. **Real-time API**: Serves cached data instantly to clients

## 📊 Monitoring

### Health Check

```bash
curl http://localhost:3001/health
```

### Server Status

```bash
curl http://localhost:3001/api/status
```

### Cache Statistics

```bash
curl http://localhost:3001/api/stats/cache
```

## 🏭 Production Deployment

### Oracle Cloud Free Tier

1. Create Ubuntu instance
2. Install Node.js 16+
3. Clone repository
4. Update configuration files
5. Install PM2 for process management
6. Configure firewall (port 3001)
7. Set up reverse proxy (Nginx)

### Environment Setup

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Run with PM2
pm2 start index.js --name picule-server
pm2 startup
pm2 save
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🐛 Troubleshooting

### Common Issues

**Port already in use:**

```bash
sudo lsof -ti:3001 | xargs kill -9
```

**CORS errors:**

- Check domain in `allowedOrigins`
- Verify request origin header

**DDoS protection triggered:**

- Check IP in admin whitelist
- Reduce request frequency

**Subgraph connection issues:**

- Verify API key in .env
- Check The Graph service status

### Logs

```bash
# View real-time logs
tail -f logs/server.log

# PM2 logs
pm2 logs picule-server
```

## 🔗 Related

- [Picule Protocol Frontend](not-atm)
- [Smart Contracts](https://github.com/Vantana1995/picule-protocol)
- [The Graph Subgraph](https://github.com/Vantana1995/picule-protocol-subgraph)(https://thegraph.com/explorer/subgraphs/ExJ4cYqWhnWJyMd5N2gNU3QD21u8m6bYiBTERPnisWPN?view=Query&chain=arbitrum-one)

## 📄 License

MIT License

---

**Built with ❤️ for the Picule Protocol ecosystem**
