#!/bin/bash

# ===== CONFIG =====
DEFAULT_REPO="https://github.com/thegrtnx/nestboiler"
DEFAULT_VERSION="1.0.0"

# ===== COLORS =====
colored_echo() {
  local color=$1
  shift
  echo -e "\033[${color}m$*\033[0m"
}

echo -e "\n"  
# Detect OS
OS=$(uname -s)
case "$OS" in
  Linux*)     OS_TYPE="Linux";;
  Darwin*)    OS_TYPE="macOS";;
  CYGWIN*|MINGW32*|MSYS*|MINGW*) OS_TYPE="Windows";;
  *)          OS_TYPE="Unknown";;
esac

echo -e "\nOperating System Detected: $OS_TYPE\n"

# ========== ASCII BANNER ==========
cat << "EOF"

| |_| |__   ___  __ _ _ __| |_ _ __ __  __
| __| '_ \ / _ \/ _` | '__| __| '_ \\ \/ /
| |_| | | |  __/ (_| | |  | |_| | | |>  < 
 \__|_| |_|\___|\__, |_|   \__|_| |_/_/\_\
                |___/   

Follow me on GitHub: https://github.com/thegrtnx

EOF

# ===== CHECK FOR PNPM =====
if ! command -v pnpm &> /dev/null; then
  colored_echo 33 "🔍 pnpm not found. Installing globally..."
  npm install -g pnpm
  if [ $? -ne 0 ]; then
    colored_echo 31 "❌ Failed to install pnpm. Exiting."
    exit 1
  fi
  colored_echo 32 "✔ pnpm installed successfully."
else
  colored_echo 32 "✔ pnpm is already installed."
fi

# ===== GET PROJECT NAME =====
if [ -n "$1" ]; then
  PROJECT_NAME="$1"
  colored_echo 36 "🔧 Using project name from argument: $PROJECT_NAME"
else
  colored_echo 36 "📛 Enter your project name: "
  read -r PROJECT_NAME
  if [ -z "$PROJECT_NAME" ]; then
    colored_echo 33 "⚠ No project name provided. Using default 'nestjs-auth'."
    PROJECT_NAME="nestjs-auth"
  fi
fi

# ===== CLONE THE REPO =====
colored_echo 36 "📦 Cloning the repository into ./$PROJECT_NAME ..."
git clone "$DEFAULT_REPO" "$PROJECT_NAME"

if [ $? -ne 0 ]; then
  colored_echo 31 "❌ Failed to clone repository."
  exit 1
fi

cd "$PROJECT_NAME" || exit 1

# ===== UPDATE package.json =====
if [ -f "package.json" ]; then
  sed -i.bak "s/\"name\": \".*\"/\"name\": \"$PROJECT_NAME\"/" package.json
  sed -i.bak "s/\"version\": \".*\"/\"version\": \"$DEFAULT_VERSION\"/" package.json
  rm package.json.bak
  colored_echo 32 "✔ package.json updated with project name and version."
else
  colored_echo 31 "❌ package.json not found."
  exit 1
fi

# ===== SETUP .env FILE =====
colored_echo 36 "🛠 Setting up .env file..."

if [ -f "env.example" ]; then
  cp env.example .env
  colored_echo 32 "✔ .env file created from env.example."

  # Generate secure keys
  if command -v openssl &> /dev/null; then
    REFRESH_SECRET=$(openssl rand -hex 32)
    SECRET_KEY=$(openssl rand -hex 32)
  else
    REFRESH_SECRET=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 64)
    SECRET_KEY=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 64)
    colored_echo 33 "⚠ OpenSSL not found. Used fallback for generating secrets."
  fi

  # Convert project name to underscores for platform name
  PLATFORM_NAME=$(echo "$PROJECT_NAME" | tr ' ' '_')

  # Remove any existing lines
  sed -i.bak '/^PLATFORM_NAME=/d' .env
  sed -i.bak '/^REFRESH_SECRET_KEY=/d' .env
  sed -i.bak '/^SECRET_KEY=/d' .env

  # Append to the end of the .env file
  cat <<EOF >> .env
PLATFORM_NAME=$PLATFORM_NAME
REFRESH_SECRET_KEY=$REFRESH_SECRET
SECRET_KEY=$SECRET_KEY
EOF

  rm .env.bak
  colored_echo 32 "✔ PLATFORM_NAME, REFRESH_SECRET_KEY, and SECRET_KEY updated in .env"
else
  colored_echo 33 "⚠ env.example not found. Skipping env setup."
fi

# ===== INSTALL DEPENDENCIES =====
colored_echo 36 "📥 Installing dependencies with pnpm..."
pnpm install

if [ $? -eq 0 ]; then
  colored_echo 32 "🎉 Setup complete!"
  echo -e "\nNext Steps:"
  echo "  cd $PROJECT_NAME"
  echo "  pnpm approve-builds"
  echo "  pnpm install"
  echo "  pnpm run prisma:dev"
  echo "  pnpm run start:dev"
else
  colored_echo 31 "❌ Failed to install dependencies."
fi
