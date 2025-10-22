#!/usr/bin/env python3
# ci/quota_guard_readme.md — note: le test e2e quota nécessite Runner up + session avec quota=0
print("E2E quota test: \n"
      "- Appliquer migration 090.\n"
      "- Mettre quota_tokens=0 dans runtime.sessions pour la session.\n"
      "- Appeler POST /runner/step -> attendre HTTP 429.")
