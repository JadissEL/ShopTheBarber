/** Shared Clerk UI branding for ShopTheBarber auth pages (Visual System v2). */

export const clerkAuthAppearance = {

  variables: {

    colorPrimary: 'hsl(var(--primary))',

    colorText: 'hsl(var(--foreground))',

    colorTextSecondary: 'hsl(var(--muted-foreground))',

    colorBackground: 'hsl(var(--card))',

    colorInputBackground: 'hsl(var(--card))',

    colorInputText: 'hsl(var(--foreground))',

    borderRadius: '0.5rem',

    fontFamily: '"DM Sans", ui-sans-serif, system-ui, sans-serif',

    fontSize: '0.875rem',

  },

  elements: {

    rootBox: 'mx-auto w-full font-sans',

    card: 'bg-card border border-foreground/10 shadow-none rounded-lg ring-0',

    headerTitle: 'text-foreground text-2xl font-sans font-semibold tracking-tight normal-case',

    headerSubtitle: 'text-muted-foreground font-sans normal-case text-sm',

    socialButtonsBlockButton:

      'border border-foreground/15 hover:bg-muted text-foreground rounded-lg h-11 font-sans',

    socialButtonsBlockButtonText: 'font-medium font-sans',

    formButtonPrimary:

      'bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg h-11 font-semibold font-sans normal-case border-0 shadow-none',

    formFieldInput:

      'bg-card border border-foreground/15 text-foreground rounded-lg font-sans h-11',

    formFieldLabel: 'text-muted-foreground font-medium font-sans normal-case text-sm',

    footerActionLink: 'text-primary hover:text-primary/90 font-semibold font-sans',

    footerActionText: 'text-muted-foreground font-sans',

    footerAction: 'pt-6 pb-2',

    footer__logo: 'hidden',

    footer__logoImage: 'hidden',

    footer__text: 'hidden',

    footerPages: 'hidden',

    dividerLine: 'bg-foreground/10',

    dividerText: 'text-muted-foreground text-xs font-sans normal-case',

    identityPreviewText: 'text-foreground font-sans',

    identityPreviewEditButton: 'text-primary font-sans',

    formFieldInputShowPasswordButton: 'text-muted-foreground hover:text-foreground',

    otpCodeFieldInput: 'border-foreground/15 text-foreground rounded-lg font-sans',

    formResendCodeLink: 'text-primary hover:text-primary/90 font-sans',

    alertText: 'text-foreground font-sans text-sm',

    alert: 'rounded-lg border border-foreground/10',

    badge: 'hidden',

    developmentModeWarning: 'hidden',

    formFieldErrorText: 'text-destructive font-sans text-xs',

    formFieldSuccessText: 'text-primary font-sans text-xs',

    navbarButton: 'text-foreground font-sans',

    profileSectionPrimaryButton: 'bg-primary hover:bg-primary/90 rounded-lg font-sans',

  },

  layout: {

    logoPlacement: 'none',

  },

};



export const clerkSignInLocalization = {

  signIn: {

    start: {

      title: 'Sign in to ShopTheBarber',

      subtitle: 'Book barbers, manage appointments, and earn rewards',

    },

  },

};



export const clerkSignUpLocalization = {

  signUp: {

    start: {

      title: 'Join ShopTheBarber',

      subtitle: 'Create your account to book barbers and earn rewards',

    },

  },

};

