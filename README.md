# NestJS Auth Boilerplate Setup

A simple script to **bootstrap your NestJS authentication project** with:

- `pnpm` support
- Automatic cloning from the boilerplate repository
- `.env` creation and secret key generation
- Dependency installation
- Ready-to-code environment in under 30 seconds 🚀

---

## 🛠 Requirements

- `curl`
- `git`
- `node` and `npm`
- `bash` (for Unix-based systems)

> ✅ The script will automatically install `pnpm` globally if it’s not already installed.

---

## ⚡ Quick Start

### Option 1 — Provide a project name

```bash
bash <(curl -sSL https://raw.githubusercontent.com/thegrtnx/nestboiler/main/bash/setup.sh) my-app
```

### Option 2 — Interactive (you’ll be prompted for the name)

```bash
bash <(curl -sSL https://raw.githubusercontent.com/thegrtnx/nestboiler/main/bash/setup.sh)
```

---

## 🧩 What It Does

- ✅ Installs `pnpm` globally (if missing)
- ✅ Clones the NestJS boilerplate repo into a folder you name
- ✅ Updates `package.json` with the project name and version
- ✅ Copies `.env.sample` to `.env`
- ✅ Auto-generates `REFRESH_SECRET_KEY` and `SECRET_KEY`
- ✅ Adds `PLATFORM_NAME=your_project_name` (spaces replaced with `_`)
- ✅ Installs all dependencies with `pnpm`

---

## 🧪 After Setup

Your project is ready to go!

```bash
cd your-project-name
pnpm run prisma:dev        # Setup and push Prisma schema
pnpm run start:dev         # Start the NestJS server
pnpm run prisma:studio     # (Optional) Use Prisma Studio
```

---

## 🧠 License

MIT © [thegrtnx](https://github.com/thegrtnx)
