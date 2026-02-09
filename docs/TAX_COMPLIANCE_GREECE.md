# Tax & Legal Compliance - Greece Implementation

**Last Updated**: January 28, 2026  
**Status**: Production Ready  
**Scope**: ShopTheBarber Greece Operations

---

## Table of Contents

1. [Tax Overview](#tax-overview)
2. [Greece Tax Rates (2026)](#greece-tax-rates-2026)
3. [Tax Calculation Implementation](#tax-calculation-implementation)
4. [Service Provider Obligations](#service-provider-obligations)
5. [Platform Obligations](#platform-obligations)
6. [Compliance Checklist](#compliance-checklist)
7. [Data Retention](#data-retention)
8. [Future Multi-Country Expansion](#future-multi-country-expansion)

---

## Tax Overview

ShopTheBarber operates in Greece as a marketplace platform connecting barbers/shops with customers. Tax obligations apply to:

- **Service Providers** (Barbers, Shops): Income tax, social security, VAT
- **Platform** (ShopTheBarber): Platform fees subject to VAT, potential withholding tax liability
- **Customers**: No direct tax obligations (transactions are B2C)

---

## Greece Tax Rates (2026)

### Value Added Tax (VAT)

| Category | Rate | Applies To |
|----------|------|-----------|
| Standard Rate | 24% | Most services (haircuts, styling) |
| Reduced Rate | 13% | Children's services, certain treatments |
| Super-Reduced | 6% | (Not applicable to barber services) |

**Greece VAT Threshold**: €30,000 annual turnover = VAT registration required

### Withholding Tax (Κατακράτηση Φόρου Δικαιωμάτων)

| Entity Type | Rate | When Applicable |
|-------------|------|-----------------|
| Self-Employed Professional | 15% | Freelance barbers |
| Service Provider | 20% | Shop-based providers |
| Independent Contractor | 10% | One-off services |

**Platform Liability**: ShopTheBarber acts as withholding agent. Taxes withheld are remitted to Greek tax authority (Ενιαία Ανεξάρτητη Διοίκηση Φόρων - ΕΝΦΙΑ) monthly.

### Income Tax (Φόρος Εισοδήματος)

**Personal Income (Self-Employed)**:

| Income Range (€) | Tax Rate | Cumulative Tax |
|------------------|----------|----------------|
| 0 - 10,000 | 9% | €900 |
| 10,001 - 30,000 | 22% | €5,300 + 22% above 10k |
| 30,001 - 50,000 | 28% | €9,900 + 28% above 30k |
| 50,001+ | 44% | €15,500 + 44% above 50k |

**Businesses** (Limited Companies): Flat 22% corporate tax

### Social Security (ΙΚΑ-ΕΤΑΜ)

**Self-Employed Barbers**:
- Contribution Rate: ~20% of income
- Minimum Annual: €3,600-€5,000
- Entitlements: Health insurance, pension, unemployment

**Shop Employees**:
- Employer Contribution: ~28% of salary
- Employee Contribution: ~8% of salary

### Professional Fees

**Chamber of Commerce & Industry (Βιοτεχνικό Επιμελητήριο)**:
- Annual membership: €150-€300
- Used for: Professional regulation, dispute resolution

---

## Tax Calculation Implementation

### Backend Function: `calculateTaxes()`

**Location**: `functions/calculateTaxes.js`

**Purpose**: Automatically calculate applicable taxes on transactions

**Inputs**:
```javascript
{
  amount: number,              // Transaction amount in EUR
  country_code: 'GR',          // Supports future expansion
  entity_type: 'service_provider', // 'barber', 'shop', 'self_employed'
  tax_year: 2026              // Optional, defaults to current year
}
```

**Outputs**:
```javascript
{
  gross_amount: 500,
  tax_breakdown: {
    vat: { rate: 0.24, amount: 120 },
    withholding_tax: { rate: 0.15, amount: 75 },
    professional_fee: { rate: 0.02, amount: 10 }
  },
  total_taxes: 205,
  net_amount: 295,
  country_code: 'GR',
  tax_year: 2026
}
```

**Integration Points**:

1. **Payout Calculation** (Provider Domain):
   - Called when calculating barber/shop earnings
   - Stored in `Payout` entity for audit trail
   - Notification sent to provider with tax breakdown

2. **Invoice Generation** (Admin Domain):
   - Used to generate tax-compliant invoices
   - Supports export for accounting/tax filing

3. **Platform Financial Reporting** (Admin Domain):
   - Aggregates tax liabilities
   - Generates monthly/quarterly reports for authorities

### TaxConfiguration Entity

**Location**: `entities/TaxConfiguration.json`

**Fields**:
- `country_code`: ISO code (e.g., 'GR')
- `vat_rate`: VAT percentage
- `withholding_tax_rate`: Withholding tax %
- `income_tax_brackets`: Progressive rates
- `social_security_rate`: S.S. %
- `vat_threshold_annual`: Revenue limit for registration

**Greece Configuration (Seed Data)**:
```json
{
  "country_code": "GR",
  "vat_rate": 0.24,
  "withholding_tax_rate": 0.15,
  "vat_threshold_annual": 30000,
  "social_security_rate": 0.20,
  "professional_tax_rate": 0.02,
  "quarterly_reporting_required": true
}
```

---

## Service Provider Obligations

### For Independent Barbers

| Obligation | Timeline | Details |
|-----------|----------|---------|
| **Tax ID Registration** | Before first booking | Register with AADE (Αρχή Δημοσίων Εσόδων) |
| **VAT Registration** | If €30k+ annual revenue | Register as VAT taxpayer |
| **Monthly VAT Filing** | Monthly (20th of month) | File VAT returns to AADE |
| **Income Tax Filing** | By May 20 (annually) | Personal income tax return |
| **Social Security** | Quarterly | Pay ΙΚΑ-ΕΤΑΜ contributions |
| **Professional Fee** | Annually | Chamber of Commerce membership |
| **Withholding Tax** | Platform remits | 15% withheld on bookings (platform pays on behalf) |
| **Accounting Records** | Ongoing | Keep invoices, receipts, transaction logs |

### For Shop Owners

| Obligation | Timeline | Details |
|-----------|----------|---------|
| **Business Registration** | Before operations | Register with AADE as business entity |
| **VAT Registration** | Upon registration | Most shops exceed €30k threshold |
| **Monthly VAT Filing** | Monthly | File VAT returns |
| **Corporate Income Tax** | By June 30 (annually) | 22% corporate tax rate |
| **Payroll Taxes** | Monthly | Withhold employee taxes, pay employer SS |
| **Financial Statements** | By May 20 | Audited or unaudited depending on size |
| **Professional License** | Annually | Barber shop license + chamber fees |

---

## Platform Obligations

### ShopTheBarber as Marketplace Operator

**VAT Obligations**:
- Platform fees (commission) subject to 24% VAT
- Monthly VAT declaration required
- Reverse charge mechanism may apply for B2B bookings

**Withholding Tax Responsibility**:
- Act as withholding agent (παρακρατητής φόρου)
- Withhold 15% from payments to service providers
- File monthly withholding tax declaration (Ε3)
- Remit to AADE within 10 days of filing

**Reporting Obligations**:
- Monthly VAT return (€ & transactions)
- Annual withholding tax summary
- Quarterly financial disclosures
- Annual profit/loss statement

**Record-Keeping**:
- Transaction logs (minimum 6 years)
- VAT invoices (copies, both directions)
- Withholding tax records
- Payout receipts & tax calculations

---

## Compliance Checklist

### Pre-Launch (Q1 2026)

- [ ] Register ShopTheBarber as business entity with AADE
- [ ] Obtain VAT number (ΑΦΜ)
- [ ] Register for withholding tax obligations
- [ ] Set up accounting system (MYDATA integration)
- [ ] Create tax calculation functions
- [ ] Generate sample invoices for review by accountant
- [ ] Document all tax policies in app
- [ ] Create automated tax reporting system
- [ ] Legal review of terms (withholding tax disclosure)
- [ ] Notify service providers of tax obligations via dashboard

### Ongoing (Monthly)

- [ ] Calculate withholding taxes on all payouts
- [ ] File VAT return (by 20th of month)
- [ ] File withholding tax declaration (E3)
- [ ] Reconcile transaction records with accounting software
- [ ] Monitor for VAT compliance by service providers
- [ ] Archive tax documentation

### Quarterly

- [ ] Generate tax summary report
- [ ] Review compliance status
- [ ] Prepare for tax authority inquiries
- [ ] Update TaxConfiguration if rates change

### Annually (by May 20)

- [ ] File annual corporate income tax return
- [ ] Audit financial statements (if required)
- [ ] File annual withholding tax summary
- [ ] Provide service providers with tax summaries
- [ ] Update Privacy Policy if needed

---

## Data Retention

**Tax-Related Records** (Minimum 6 Years):
- Transaction logs
- Invoice copies
- Withholding tax records
- Payout receipts with tax breakdowns
- Communications regarding taxes

**Beyond Scope**: GDPR compliance for user data; tax records fall under accounting retention rules.

---

## Future Multi-Country Expansion

### Scalability Design

The `TaxConfiguration` entity supports future expansion:

**Template for New Countries**:
```json
{
  "country_code": "DE",
  "vat_rate": 0.19,
  "withholding_tax_rate": 0.20,
  "vat_threshold_annual": 22500,
  "personal_income_tax_brackets": [
    { "min": 0, "max": 11600, "rate": 0 },
    { "min": 11600, "max": 47000, "rate": 0.42 }
  ],
  "social_security_rate": 0.18,
  "professional_tax_rate": 0.01,
  "quarterly_reporting_required": true
}
```

**Required Steps for New Country**:
1. Update `TaxConfiguration` with rates
2. Extend `calculateTaxes()` with country-specific logic
3. Create country-specific documentation (like this file)
4. Test with local accountant
5. Legal review for compliance
6. Enable gradually (feature flag)

**Supported Countries (Future)**:
- [ ] Germany (DE)
- [ ] France (FR)
- [ ] Italy (IT)
- [ ] Spain (ES)
- [ ] United Kingdom (UK)
- [ ] United States (US)

---

## Legal Disclaimers

**ShopTheBarber is not a tax advisor.** Service providers should:
- Consult with a Greek tax accountant
- File personal returns annually
- Keep complete business records
- Understand their specific obligations based on business structure

**Platform Responsibility**:
- Withholding tax only; not responsible for individual tax filing
- Provide transaction summaries (not tax advice)
- Maintain audit-trail for 6 years

**Regulatory Contacts**:
- **AADE (Greek Tax Authority)**: https://www.aade.gr
- **ΕΝΦΙΑ (Tax Data Exchange)**: mydata.aade.gr
- **Chamber of Commerce**: https://www.gacci.org.gr

---

## Compliance Sign-Off

| Role | Date | Approval |
|------|------|----------|
| Engineering Lead | Jan 28, 2026 | ✅ |
| Legal Review | Jan 28, 2026 | ⏳ (Pending) |
| Tax Accountant | TBD | ⏳ (Pending) |
| Finance Lead | TBD | ⏳ (Pending) |

---

**Version**: 1.0  
**Last Updated**: January 28, 2026  
**Owner**: ShopTheBarber Compliance Team