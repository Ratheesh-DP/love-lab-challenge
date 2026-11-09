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
- User challenge data syncs per account, but the wallet and point ledger are server-authoritative and change only through validated database functions. Why: browser state can be edited.
- Admin purchase decisions use one role-checked database function that updates the purchase, credits points atomically, and creates the dater's notification. Why: approval, wallet credit, and notice must not drift apart.
- QR purchases stay manual until a payment provider is connected; keep bundle identifiers and prices aligned with the database purchase policy. Why: QR transfers cannot be verified automatically.
