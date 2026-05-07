declare global {
  interface Window {
    google?: any;
  }
}

export type GoogleCredentialResponse = {
  credential?: string;
};

export function isGoogleGsiReady() {
  return Boolean(window.google?.accounts?.id);
}

export function renderGoogleButton(target: HTMLElement, clientId: string, onCredential: (idToken: string) => void) {
  if (!isGoogleGsiReady()) throw new Error("Google Identity Services not loaded");

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response: GoogleCredentialResponse) => {
      if (response.credential) onCredential(response.credential);
    },
  });

  window.google.accounts.id.renderButton(target, {
    theme: "outline",
    size: "large",
    width: 360,
    text: "continue_with",
    shape: "rectangular",
    logo_alignment: "left",
  });
}

