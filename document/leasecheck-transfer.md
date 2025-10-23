# Colorado Lease Check Workspace Export

To help you copy the Colorado Lease Check assets out of this transient environment, the repository now ships a plain-text patch
that recreates every UI, backend, and deployment file we produced together. You can download the patch and apply it manually or
run the helper script for a one-command import on any machine that has `curl`, `git`, and `bash`.

## What is included

The patch materialises the following directories and files:

- `chat2db-client/src/pages/colorado-lease-check/`
- `deployment/leasecheck-cloud/`
- `document/hostinger-deployment.md`
- `document/leasecheck-status.md`
- `services/leasecheck-backend/`
- `script/build-hostinger-package.sh`
- `script/hostinger-backend-setup.sh`
- `script/hostinger-setup.sh`

These are the same assets that power the UI, backend, Hostinger installer, and documentation we reviewed together.

## Downloading and applying

### Manual patch application (Option A)

If you want to perform every step yourself, follow this manual workflow:

1. Download the plain-text patch file.
   ```bash
   curl -L https://raw.githubusercontent.com/dev27-eng/Chat2DB/work/artifacts/leasecheck-workspace.patch \
     -o leasecheck-workspace.patch
   ```
2. Move into a clean clone of the upstream repository (or any workspace that matches commit `698323ae`).
   ```bash
   git clone https://github.com/dev27-eng/Chat2DB.git leasecheck-import
   cd leasecheck-import
   git reset --hard 698323ae
   ```
3. Apply the patch and review the results.
   ```bash
   git apply --stat ../leasecheck-workspace.patch
   git apply ../leasecheck-workspace.patch
   ```

This will create the directories listed above in your current working folder. You can then inspect, relocate, or commit them into your own repository.

### Automated helper script (Option B)

If you prefer to avoid the manual steps above, copy the helper into any folder, make it executable, and run it:

```bash
curl -L https://raw.githubusercontent.com/dev27-eng/Chat2DB/work/script/apply-leasecheck-patch.sh \
  -o apply-leasecheck-patch.sh
chmod +x apply-leasecheck-patch.sh
./apply-leasecheck-patch.sh
```

The script downloads the patch, verifies its checksum, and runs `git apply` in the current repository (or the directory specified via `LEASECHECK_TARGET_DIR`).

### GitHub pull request tools (Option C)

If you prefer to work entirely in the GitHub UI, you can also leverage the built-in **Create PR** button on your fork:

1. Navigate to your fork at `https://github.com/dev27-eng/Chat2DB` and press **Create PR**.
2. Choose **Create draft PR** so the change stays private until you are ready to merge it.
3. In the resulting draft pull request, open the **Copy git apply** or **Copy patch** menus to grab the generated patch.
4. On the destination machine, run `git apply` (or `git am` if you saved it as an email patch) using the clipboard contents to recreate the changes without downloading additional files.

This approach is handy when you only need the diff and want Git to track the changes automatically after applying the patch.

## Verifying integrity

To confirm that the download was not corrupted, compare the SHA-256 hash:

```bash
sha256sum leasecheck-workspace.patch
```

You should see the following value:

```
529776606af3a995ceb8543f01aab1aeffef655cc313ac83465c3d69e214ad23
```

## Next steps

- Apply the patch wherever you plan to continue development (local machine, Hostinger VPS, etc.).
- Commit the extracted files into your `dev27-eng/Chat2DB` fork or any other repository you prefer.
- Follow the deployment guides in `document/hostinger-deployment.md` and `deployment/leasecheck-cloud/README.md` once the files are in place.

If you need a refreshed snapshot later, rerun `script/build-hostinger-package.sh` and export a new patch with `git diff > artifacts/leasecheck-workspace.patch` before sharing it.
