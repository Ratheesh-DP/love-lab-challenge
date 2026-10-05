<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Dater state syncs as one JSON row per user in user_state (store.ts attachUser/scheduleSave); reports also go to a separate reports table so moderators can review them. Why: cross-device persistence with minimal refactor.
- Points live in the user-editable state blob; move balances to server-validated logic before selling points. Why: client-written points can be faked.
