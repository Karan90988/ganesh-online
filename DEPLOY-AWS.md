# Deploying Ganesh Trading to AWS — Practice Guide (VPC → RDS → EC2)

A hands-on, security-focused walkthrough. Your Vercel + Neon production stays
untouched; this is a parallel sandbox.

- **Region:** use **ap-south-1 (Mumbai)** — closest to you for testing.
- **Order matters:** you build the *network* first, then put the database and
  server inside it.
- **Free tier:** pick `db.t3.micro` / `db.t4g.micro` (RDS) and `t2.micro` /
  `t3.micro` (EC2) to stay in the 12-month free tier.

> Golden rule you're practicing: **the database is never reachable from the
> internet** — only the EC2 server inside the VPC can talk to it.

---

## Phase 1 — VPC (the private network)

The easy + correct way is the built-in wizard (it creates subnets, gateways and
routes for you the right way).

1. AWS Console → search **VPC** → **Create VPC**.
2. Choose **VPC and more** (the wizard).
3. Settings:
   - **Name tag:** `ganesh-vpc`
   - **IPv4 CIDR:** `10.0.0.0/16`
   - **Number of Availability Zones (AZs):** **2**  ← RDS needs 2 AZs
   - **Public subnets:** **2**
   - **Private subnets:** **2**
   - **NAT gateways:** **None** (saves money; the DB doesn't need outbound internet)
   - **VPC endpoints:** None
4. **Create VPC.**

**What this gave you (and why):**
- **2 public subnets** → where the EC2 lives (has a route to the internet).
- **2 private subnets** → where RDS lives (no internet route = isolated).
- **Internet Gateway** → lets the public subnet reach the internet.
- **Route tables** → public subnets route `0.0.0.0/0` to the IGW; private subnets
  do not (that's what makes them private).

---

## Phase 2 — Security Groups (the firewalls)

Create these **before** RDS/EC2 so you can attach them. VPC → **Security Groups**
→ **Create security group** (twice).

### 2a. EC2 security group
- **Name:** `ganesh-ec2-sg`
- **VPC:** `ganesh-vpc`
- **Inbound rules:**
  | Type | Port | Source |
  |------|------|--------|
  | SSH | 22 | **My IP** (not Anywhere) |
  | HTTP | 80 | Anywhere `0.0.0.0/0` |
  | HTTPS | 443 | Anywhere `0.0.0.0/0` |
- Outbound: leave default (all).

### 2b. RDS security group
- **Name:** `ganesh-rds-sg`
- **VPC:** `ganesh-vpc`
- **Inbound rules:**
  | Type | Port | Source |
  |------|------|--------|
  | PostgreSQL | 5432 | **`ganesh-ec2-sg`** (choose the SG, NOT an IP) |

> This is the key lesson: RDS accepts connections **only from the EC2's security
> group** — not from the internet, not even from your laptop.

---

## Phase 3 — RDS (PostgreSQL, private)

1. Console → **RDS** → **Create database**.
2. **Standard create** → Engine: **PostgreSQL**.
3. **Templates:** Free tier.
4. **Settings:**
   - DB instance identifier: `ganesh-db`
   - Master username: `ganeshadmin`
   - Master password: set a strong one (save it).
5. **Instance:** `db.t3.micro` (or `db.t4g.micro`).
6. **Storage:** 20 GB gp3 (default), turn **off** storage autoscaling for practice.
7. **Connectivity:**
   - **VPC:** `ganesh-vpc`
   - **DB subnet group:** it will create one from your **private** subnets (good).
   - **Public access:** **No**  ← critical
   - **VPC security group:** choose **existing → `ganesh-rds-sg`** (remove the default).
   - **Availability Zone:** no preference.
8. **Additional config:**
   - Initial database name: `ganesh`
   - Backups: keep defaults (7 days is fine).
9. **Create database.** Wait ~5–10 min until status = **Available**.
10. Copy the **Endpoint** (looks like `ganesh-db.xxxx.ap-south-1.rds.amazonaws.com`).

Your connection string will be:
```
postgresql://ganeshadmin:PASSWORD@ganesh-db.xxxx.ap-south-1.rds.amazonaws.com:5432/ganesh?sslmode=require
```

> ✅ Verify isolation: from your **laptop**, `psql` to that endpoint should
> **time out / fail**. That's correct — only the EC2 can reach it.

---

## Phase 4 — EC2 (the server)

1. Console → **EC2** → **Launch instance**.
2. **Name:** `ganesh-server`.
3. **AMI:** Ubuntu Server 24.04 LTS.
4. **Instance type:** `t2.micro` / `t3.micro` (free tier).
5. **Key pair:** **Create new key pair** → download the `.pem` (this is your SSH
   login — keep it safe, you can't re-download it).
6. **Network settings → Edit:**
   - **VPC:** `ganesh-vpc`
   - **Subnet:** one of the **public** subnets.
   - **Auto-assign public IP:** **Enable**.
   - **Firewall / security group:** **Select existing → `ganesh-ec2-sg`**.
7. **Storage:** 20–30 GB gp3.
8. **Launch instance.**
9. (Recommended) **Allocate an Elastic IP** (EC2 → Elastic IPs → Allocate →
   Associate to `ganesh-server`) so the public IP never changes.

### Connect + verify the private DB link
```bash
# from your laptop (chmod the key first on mac/linux; on Windows use the .pem path)
ssh -i ganesh-key.pem ubuntu@<EC2_PUBLIC_IP>

# on the EC2:
sudo apt update && sudo apt install -y postgresql-client
psql "postgresql://ganeshadmin:PASSWORD@<RDS_ENDPOINT>:5432/ganesh?sslmode=require"
```
If `psql` connects **from the EC2** but **not from your laptop**, your network
security is correct. 🎉

---

## What's next (separate steps — ask when ready)
- **Deploy the app** on EC2 (Docker — you already have a `Dockerfile`), pointing
  `DATABASE_URL`/`DIRECT_URL` at the RDS endpoint.
- **Migrate data** from Neon: `pg_dump` → `pg_restore`.
- **HTTPS/TLS**: domain + Nginx + Let's Encrypt (certbot), HTTP→HTTPS redirect.
- **Secrets**: move DB creds into SSM Parameter Store + an EC2 IAM role (no
  plaintext `.env`, no AWS keys on the box).

---

## Quick mental model
| Resource | Lives in | Reachable from | Teaches |
|----------|----------|----------------|---------|
| VPC + subnets | — | — | network isolation |
| Security groups | VPC | — | least-privilege firewalls |
| **RDS** | **private** subnet | **only EC2 SG** | private database |
| **EC2** | **public** subnet | SSH(your IP)+80/443 | hardened server |
