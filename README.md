
---

# No-TAPS Installation Guide

### Linux (Ubuntu CLI)

#### 1. Install Docker Engine

**Add Docker's official GPG key:**

```bash
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
```

**Add the repository to Apt sources:**

```bash
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

#### 2. Run the Docker first time command

```bash
sudo docker compose up --build
```

#### 3. Access the server at:

```plaintext
http://localhost:9000
```
### Windows (Powershell CLI)
#### 1. Install Docker Desktop
```plaintext
https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe
```
#### 2. Open a PS Window
#### 3. CD to No-TAPS Git Repository.
#### 4. Run the following.
```bash
docker compose up --build
```
##### Note: It is common to get a Docker service error. Please ensure that Docker Desktop is open in the background.

#### 5. Access the server at:

```plaintext
http://localhost:9000
```



### Usage:
##### Note: If you're using a Windows machine you do not need include the ```sudo``` command

#### Turn off Docker Containers
```bash
sudo docker compose down
```
#### Turn off Docker Containers and reset the database
```bash
sudo docker compose down -v
```
#### Turn off and regular shutdown
```bash 
sudo docker compose down
```