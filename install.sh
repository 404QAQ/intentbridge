#!/bin/bash
set -euo pipefail

# IntentBridge Installer for macOS and Linux
# Usage: curl -fsSL https://intentbridge.dev/install.sh | bash

BOLD='\033[1m'
ACCENT='\033[38;2;99;102;241m'       # Indigo
INFO='\033[38;2;136;146;176m'         # text-secondary
SUCCESS='\033[38;2;34;197;94m'        # green
WARN='\033[38;2;251;146;60m'          # orange
ERROR='\033[38;2;239;68;68m'          # red
MUTED='\033[38;2;100;116;139m'        # slate
NC='\033[0m' # No Color

TMPFILES=()
cleanup_tmpfiles() {
    local f
    for f in "${TMPFILES[@]:-}"; do
        rm -rf "$f" 2>/dev/null || true
    done
}
trap cleanup_tmpfiles EXIT

# UI Functions
ui_info() {
    echo -e "${MUTED}●${NC} $1"
}

ui_success() {
    echo -e "${SUCCESS}✓${NC} $1"
}

ui_warn() {
    echo -e "${WARN}⚠${NC} $1"
}

ui_error() {
    echo -e "${ERROR}✗${NC} $1"
}

ui_section() {
    echo ""
    echo -e "${ACCENT}${BOLD}$1${NC}"
}

print_banner() {
    echo ""
    echo -e "${ACCENT}${BOLD}  🌉 IntentBridge Installer${NC}"
    echo -e "${INFO}  AI-Powered Requirement Management for Claude Code${NC}"
    echo ""
}

# Detect OS
detect_os() {
    OS="unknown"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ "$OSTYPE" == "linux-gnu"* ]] || [[ -n "${WSL_DISTRO_NAME:-}" ]]; then
        OS="linux"
    fi

    if [[ "$OS" == "unknown" ]]; then
        ui_error "Unsupported operating system"
        echo "This installer supports macOS and Linux (including WSL)."
        exit 1
    fi

    ui_success "Detected OS: $OS"
}

# Check Node.js
check_node() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [[ "$NODE_VERSION" -ge 18 ]]; then
            ui_success "Node.js v$(node -v | cut -d'v' -f2) found"
            return 0
        else
            ui_warn "Node.js $(node -v) found, but v18+ required"
            return 1
        fi
    else
        ui_info "Node.js not found"
        return 1
    fi
}

# Check npm
check_npm() {
    if command -v npm &> /dev/null; then
        ui_success "npm v$(npm -v) found"
        return 0
    else
        ui_info "npm not found"
        return 1
    fi
}

# Install Node.js (macOS via Homebrew)
install_node_macos() {
    ui_info "Installing Node.js via Homebrew..."

    # Check Homebrew
    if ! command -v brew &> /dev/null; then
        ui_info "Homebrew not found, installing..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

        # Add to PATH
        if [[ -f "/opt/homebrew/bin/brew" ]]; then
            eval "$(/opt/homebrew/bin/brew shellenv)"
        elif [[ -f "/usr/local/bin/brew" ]]; then
            eval "$(/usr/local/bin/brew shellenv)"
        fi
        ui_success "Homebrew installed"
    fi

    # Install Node.js
    brew install node@22
    brew link node@22 --overwrite --force 2>/dev/null || true
    ui_success "Node.js installed"
}

# Install Node.js (Linux)
install_node_linux() {
    ui_info "Installing Node.js via NodeSource..."

    if command -v apt-get &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif command -v dnf &> /dev/null; then
        curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
        sudo dnf install -y nodejs
    elif command -v yum &> /dev/null; then
        curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
        sudo yum install -y nodejs
    else
        ui_error "Could not detect package manager"
        echo "Please install Node.js 18+ manually: https://nodejs.org"
        exit 1
    fi

    ui_success "Node.js installed"
}

# Install IntentBridge
install_intentbridge() {
    ui_info "Installing IntentBridge..."

    # Check if already installed
    if command -v ib &> /dev/null; then
        ui_info "IntentBridge already installed, upgrading..."
        npm update -g intentbridge
    else
        npm install -g intentbridge
    fi

    ui_success "IntentBridge installed"
}

# Check Claude Code
check_claude_code() {
    if command -v claude &> /dev/null; then
        ui_success "Claude Code CLI found"
        return 0
    else
        ui_info "Claude Code CLI not found (optional)"
        return 1
    fi
}

# Configure Claude Code API key
configure_claude_api_key() {
    echo ""
    ui_section "Step 2: Configure Claude API Key"

    if [[ -f "$HOME/.config/claude/config.json" ]]; then
        ui_success "Claude Code configuration found"
        return 0
    fi

    ui_info "Claude API key is required for AI features"
    echo ""
    read -p "$(echo -e ${MUTED}Enter your Claude API key \(or press Enter to skip\): ${NC})" API_KEY

    if [[ -n "$API_KEY" ]]; then
        mkdir -p "$HOME/.config/claude"
        cat > "$HOME/.config/claude/config.json" <<EOF
{
  "api_key": "$API_KEY"
}
EOF
        ui_success "Claude API key configured"
    else
        ui_info "Skipped - you can configure later with: ib ai config"
    fi
}

# Configure IntentBridge AI
configure_ib_ai() {
    echo ""
    ui_section "Step 3: Configure IntentBridge AI"

    if [[ -f ".intentbridge/ai-config.json" ]]; then
        ui_success "IntentBridge AI configuration found"
        return 0
    fi

    ui_info "IntentBridge can use OpenAI, Anthropic, or local models"
    echo ""
    ui_info "Available options:"
    echo "  1) Anthropic Claude (recommended)"
    echo "  2) OpenAI GPT"
    echo "  3) Local model (Ollama)"
    echo "  4) Skip"
    echo ""
    read -p "$(echo -e ${MUTED}Select AI provider [1-4]: ${NC})" PROVIDER_CHOICE

    case "$PROVIDER_CHOICE" in
        1)
            read -p "$(echo -e ${MUTED}Enter Anthropic API key: ${NC})" API_KEY
            if [[ -n "$API_KEY" ]]; then
                ib ai config --provider anthropic --api-key "$API_KEY"
                ui_success "Anthropic Claude configured"
            fi
            ;;
        2)
            read -p "$(echo -e ${MUTED}Enter OpenAI API key: ${NC})" API_KEY
            if [[ -n "$API_KEY" ]]; then
                ib ai config --provider openai --api-key "$API_KEY"
                ui_success "OpenAI configured"
            fi
            ;;
        3)
            ui_info "Make sure Ollama is running locally"
            ib ai config --provider local --base-url "http://localhost:11434"
            ui_success "Local model configured"
            ;;
        4)
            ui_info "Skipped - you can configure later with: ib ai config"
            ;;
        *)
            ui_info "Invalid choice, skipping"
            ;;
    esac
}

# Initialize project
initialize_project() {
    echo ""
    ui_section "Step 4: Initialize Project"

    # Check if already initialized
    if [[ -d ".intentbridge" ]]; then
        ui_success "Project already initialized"
        return 0
    fi

    read -p "$(echo -e ${MUTED}Initialize IntentBridge in current directory? [Y/n]: ${NC})" INIT_CHOICE

    if [[ "$INIT_CHOICE" =~ ^[Nn]$ ]]; then
        ui_info "Skipped - run 'ib init' manually when ready"
        return 0
    fi

    ib init
    ui_success "Project initialized"

    # Add first requirement
    read -p "$(echo -e ${MUTED}Add your first requirement? [Y/n]: ${NC})" ADD_REQ

    if [[ ! "$ADD_REQ" =~ ^[Nn]$ ]]; then
        ib req add
    fi
}

# Start Web UI
start_web_ui() {
    echo ""
    ui_section "Step 5: Launch Web UI (Optional)"

    read -p "$(echo -e ${MUTED}Start Web UI dashboard? [Y/n]: ${NC})" START_WEB

    if [[ "$START_WEB" =~ ^[Nn]$ ]]; then
        ui_info "Skipped - run 'ib web start' manually when ready"
        return 0
    fi

    ui_info "Starting Web UI..."
    ui_info "Dashboard: http://localhost:3000"
    ui_info "API Server: http://localhost:9528"
    echo ""
    ui_info "Press Ctrl+C to stop the servers"

    ib web start
}

# Show success message
show_success() {
    echo ""
    echo -e "${SUCCESS}${BOLD}🎉 IntentBridge installed successfully!${NC}"
    echo ""
    ui_info "Quick start commands:"
    echo "  ib req add          Add a new requirement"
    echo "  ib req list         List all requirements"
    echo "  ib ai understand    Generate AI understanding"
    echo "  ib web start        Launch Web UI dashboard"
    echo "  ib --help           Show all commands"
    echo ""
    ui_info "Documentation:"
    echo "  README: https://github.com/404QAQ/intentbridge#readme"
    echo "  Docs:   https://github.com/404QAQ/intentbridge/tree/main/docs"
    echo ""
    ui_info "Next steps:"
    echo "  1. Navigate to your project: cd /path/to/your/project"
    echo "  2. Initialize IntentBridge: ib init"
    echo "  3. Add requirements: ib req add"
    echo "  4. Start Web UI: ib web start"
    echo ""
}

# Main installation flow
main() {
    print_banner

    # Step 0: Detect OS
    detect_os

    # Step 1: Check and install dependencies
    ui_section "Step 1: Check Dependencies"

    # Check Node.js
    if ! check_node; then
        if [[ "$OS" == "macos" ]]; then
            install_node_macos
        elif [[ "$OS" == "linux" ]]; then
            install_node_linux
        fi
    fi

    # Check npm
    if ! check_npm; then
        ui_error "npm not found after Node.js installation"
        exit 1
    fi

    # Check Claude Code (optional)
    check_claude_code || true

    # Install IntentBridge
    install_intentbridge

    # Verify installation
    if ! command -v ib &> /dev/null; then
        ui_warn "IntentBridge installed but not on PATH"
        ui_info "You may need to restart your terminal or run: source ~/.bashrc (or ~/.zshrc)"
    fi

    # Configure Claude API key (if Claude Code is installed)
    if command -v claude &> /dev/null; then
        configure_claude_api_key
    fi

    # Configure IntentBridge AI
    configure_ib_ai

    # Initialize project
    initialize_project

    # Start Web UI
    start_web_ui

    # Show success message
    show_success
}

# Run main
main
