/**
 * Journey personas — one isolated Playwright storageState per role.
 * Credentials from scripts/qa-profiles.json.
 */
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { passwordForEmail } from './qa-profiles';

export const PERSONA_IDS = {
  client: 'client',
  soloBarber: 'solo-barber',
  shopOwner: 'shop-owner',
  seller: 'seller',
  company: 'company',
  blogger: 'blogger',
  admin: 'admin',
} as const;

export type JourneyPersonaId = (typeof PERSONA_IDS)[keyof typeof PERSONA_IDS];

type QaProfileRow = {
  id: string;
  email: string;
  password: string;
  role: string;
  account_type?: string;
  label?: string;
};

const profilesPath = resolve(process.cwd(), 'scripts/qa-profiles.json');

function loadProfiles(): QaProfileRow[] {
  return JSON.parse(readFileSync(profilesPath, 'utf8')) as QaProfileRow[];
}

function profileById(id: string): QaProfileRow {
  const p = loadProfiles().find((row) => row.id === id);
  if (!p) throw new Error(`QA profile not found: ${id}`);
  return p;
}

export type JourneyAuthPersona = {
  id: JourneyPersonaId;
  qaProfileId: string;
  email: string;
  password: string;
  label: string;
  role: string;
  accountType: string | null;
};

/** Personas used for authenticated Playwright journeys (7 roles). */
export const JOURNEY_AUTH_PERSONAS: JourneyAuthPersona[] = [
  {
    id: PERSONA_IDS.client,
    qaProfileId: 'qa-c1',
    ...pick('qa-c1'),
    accountType: 'client',
  },
  {
    id: PERSONA_IDS.soloBarber,
    qaProfileId: 'qa-b1',
    ...pick('qa-b1'),
    accountType: 'solo_barber',
  },
  {
    id: PERSONA_IDS.shopOwner,
    qaProfileId: 'qa-o1',
    ...pick('qa-o1'),
    accountType: 'shop',
  },
  {
    id: PERSONA_IDS.seller,
    qaProfileId: 'qa-seller',
    ...pick('qa-seller'),
    accountType: 'seller',
  },
  {
    id: PERSONA_IDS.company,
    qaProfileId: 'qa-company',
    ...pick('qa-company'),
    accountType: 'company',
  },
  {
    id: PERSONA_IDS.blogger,
    qaProfileId: 'qa-blogger',
    ...pick('qa-blogger'),
    accountType: 'blogger',
  },
  {
    id: PERSONA_IDS.admin,
    qaProfileId: 'qa-admin',
    ...pick('qa-admin'),
    accountType: null,
  },
];

function pick(qaId: string): Pick<JourneyAuthPersona, 'email' | 'password' | 'label' | 'role'> {
  const p = profileById(qaId);
  const password = passwordForEmail(p.email) ?? p.password;
  return {
    email: p.email,
    password,
    label: p.label ?? p.role,
    role: p.role,
  };
}

export function authStoragePath(personaId: JourneyPersonaId): string {
  return resolve(process.cwd(), `playwright/.auth/${personaId}.json`);
}

/** Route used during setup to prove the persona can access their dashboard zone. */
export function protectedLandingPath(personaId: JourneyPersonaId): string {
  switch (personaId) {
    case PERSONA_IDS.soloBarber:
    case PERSONA_IDS.shopOwner:
      return '/ProviderDashboard';
    case PERSONA_IDS.seller:
      return '/SellerDashboard';
    case PERSONA_IDS.company:
      return '/CompanyDashboard';
    case PERSONA_IDS.blogger:
      return '/BloggerDashboard';
    case PERSONA_IDS.admin:
      return '/GlobalFinancials';
    case PERSONA_IDS.client:
    default:
      return '/Dashboard';
  }
}

export function personaById(id: JourneyPersonaId): JourneyAuthPersona {
  const p = JOURNEY_AUTH_PERSONAS.find((row) => row.id === id);
  if (!p) throw new Error(`Unknown journey persona: ${id}`);
  return p;
}
