# 🎯 Roadmap & Future Ideas

## 🟢 Frontend UX & Metadata

- [ ] **Rich Metadata:** Add release dates, developer/author info, and a tag system to `Franchise` and `Entry` models. Display said metadata to the user in a meaningful way.
- [ ] **Improve Theming:** Improve experiencie viewing entries and milestones. Add stamps on users upon completion, completion UI elements (like dots or stars on completed elements), medals for achievements (like starting a franchise, getting halfway to completion, etc.). Vary the UI depending on franchise overall completion and completion of optional entries (with stamps, stars or trophies). Customize franchise beyond an accent color, add a franchise icon and (within fair use) some theming. Divide franchises between mostly books | mostly movies | mostly games and group by them. Allow user to pin franchises to the top of the sidebar. Add a hub of franchises in-progress with overall completion, "last seen" to know where to follow.
- [ ] **Improve Movies and Books**

## 🟡 Backend & Admin

- [ ] **Admin Dashboard:** Improve the dedicated backend UI for CRUD operations. Add useful functionalities (like batch editing).
- [ ] **Validation:** Add Zod schemas for all milestone inputs.

## 🔴 Features & Scaling

- [ ] **User System:** Implement NextAuth with roles (Admin/User). Unauthenticated users see completion checklists without any personalization, and can mark milestones but it only saves progress to autenticathed users (who can pin franchises and have a personal franchise hub/main page). Admin users can mark milestones and see the "edit" button on entries and can access the backend.
- [ ] **Social:** Allow users to share their profiles with completion stamps. Allow users to propose franchises, entries and milestones on a "Community" hub where they can also star or propose changes to others proposals, and the most voted proposals eventually get promoted to "official" (with a "Community curated" tag)
- [ ] **Media Logic:** Custom progress tracking logic for Movies (Runtime vs. Watch count).

## 🧪 Quality Assurance

- [ ] **E2E Testing:** Set up Playwright for critical "completion" flows.
