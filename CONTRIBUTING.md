# Contributing to Journey Planner

Thank you for your interest in contributing to Journey Planner! We welcome contributions from the community to help make this travel planning tool even better.

Whether you're fixing a bug, adding a new feature, improving documentation, or sharing feedback, here is how you can get involved.

---

## Code of Conduct
Please be respectful, collaborative, and constructive in all issues, pull requests, and discussions.

---

## How to Contribute

### 1. Report Bugs or Suggest Features
If you find a bug or have an idea for an improvement:
- Search the existing [Issues](https://github.com/sudhirnagendragupta/google-maps/issues) to make sure it hasn't already been reported.
- If it's a new issue, open a detailed bug report or feature request explaining the problem, steps to reproduce, and expected behavior.

### 2. Submit a Pull Request (PR)
To propose code changes:
1. **Fork the Repository:** Create a personal copy of the repository on GitHub.
2. **Clone the Fork:** Clone your personal copy to your local machine.
3. **Create a Feature Branch:** Branch off from the `main` branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Develop & Test:**
   - Make your changes in your branch.
   - Make sure your changes follow the [Coding Standards](#coding-standards) below.
   - Verify that your code builds and runs correctly.
5. **Commit Your Changes:** Write descriptive, clean commit messages.
6. **Push and Submit PR:** Push your branch to GitHub and open a Pull Request against our `main` branch. Provide a clear description of what your PR resolves.

---

## Coding Standards

### Backend (Python/FastAPI)
- **Formatting:** Follow standard PEP 8 formatting guidelines.
- **Dependencies:** If you add new packages, remember to update `backend/requirements.txt`.
- **Validation:** Ensure all API endpoints validate input schemas correctly using Pydantic models.

### Frontend (TypeScript/Next.js)
- **Framework Practices:** Use modern React hooks, TypeScript typings, and Next.js App Router patterns.
- **Styling:** Use Vanilla CSS (e.g. CSS Modules) for styling. Avoid Tailwind CSS.
- **Linting:** Run `npm run lint` inside the `frontend` folder to check for lint errors before committing.

---

## Running Local Verification Tests
Before submitting backend agent changes, please run the diagnostic script to ensure the Claude orchestrator and Google Maps tools function correctly:
```bash
cd backend
source .venv/bin/activate
python test_agent.py
```
Ensure that the script returns a successful 8-day itinerary and does not crash on schema validation checks.
