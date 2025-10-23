import React from 'react';
import { Avatar, Button, Card, Col, Collapse, List, Progress, Row, Steps, Tag, Timeline, Typography } from 'antd';
import {
  BarChart3,
  CreditCard,
  DatabaseZap,
  FileCheck,
  FileSearch,
  FileText,
  KeyRound,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Workflow,
  Scale,
  ClipboardList,
  Star,
  Users,
} from 'lucide-react';
import styles from './index.less';

const { Title, Paragraph, Text } = Typography;

const featureCards = [
  {
    icon: <ShieldCheck size={28} />,
    title: 'Regulatory Compliance Automation',
    description:
      'Colorado-specific leasing statutes, federal housing law, and municipal requirements are modeled into proactive rules so every lease is screened without manual checklists.',
  },
  {
    icon: <CreditCard size={28} />,
    title: 'Stripe-Powered Billing',
    description:
      'Secure onboarding with subscription plans, automated receipts, and prorated tenant-billed reviews built on Stripe Billing and Payment Links.',
  },
  {
    icon: <UploadCloud size={28} />,
    title: 'Guided Uploading',
    description:
      'Drag-and-drop leases, add supporting addenda, and capture structured metadata that is versioned inside Chat2DB for downstream analysis.',
  },
  {
    icon: <Sparkles size={28} />,
    title: 'AI Lease Intelligence',
    description:
      'Hybrid OCR + large language models extract clauses, compute risk signals, and support conversational follow-up with citations back to the source language.',
  },
  {
    icon: <FileCheck size={28} />,
    title: 'Compliance & Risk Reporting',
    description:
      'Generate executive summaries, operational checklists, and legally-oriented compliance packets you can export or share with counsel in one click.',
  },
  {
    icon: <Scale size={28} />,
    title: 'Tenant Fairness Rating',
    description:
      'Balance-of-obligations score highlights potential inequities against Colorado consumer protection standards, with coaching notes to improve fairness.',
  },
];

const workflowSteps = [
  {
    title: 'Create your account',
    description: 'Invite your team, configure Stripe subscription tiers, and set review SLAs.',
  },
  {
    title: 'Upload leases securely',
    description: 'Bulk import PDFs or DOCX files with SOC 2 aligned encryption and audit logs.',
  },
  {
    title: 'AI compliance review',
    description: 'LLM + policy engine flags issues, references statutes, and suggests remediation.',
  },
  {
    title: 'Approve & pay',
    description: 'Finalize the report, checkout through Stripe, and deliver packages to stakeholders.',
  },
  {
    title: 'Chat with your repository',
    description: 'Ask natural language questions against the stored lease inside Chat2DB and share threaded answers.',
  },
];

const timelineItems = [
  {
    color: 'blue',
    dot: <Workflow size={18} />,
    children: (
      <div>
        <Title level={5}>Automated Intake</Title>
        <Paragraph>
          Intake bots validate document completeness, detect missing addenda, and kick off the AI pipeline instantly.
        </Paragraph>
      </div>
    ),
  },
  {
    color: 'green',
    dot: <BarChart3 size={18} />,
    children: (
      <div>
        <Title level={5}>Compliance Analytics</Title>
        <Paragraph>
          Risk scores roll up across your portfolio with drill-down filters for property type, landlord, or regulatory regime.
        </Paragraph>
      </div>
    ),
  },
  {
    color: 'orange',
    dot: <DatabaseZap size={18} />,
    children: (
      <div>
        <Title level={5}>Qdrant Knowledge Vault</Title>
        <Paragraph>
          Every lease is embedded and versioned in Qdrant for Retrieval Augmented Generation, so follow-up questions reference the exact clause language.
        </Paragraph>
      </div>
    ),
  },
  {
    color: 'purple',
    dot: <MessageCircle size={18} />,
    children: (
      <div>
        <Title level={5}>Conversational Reviews</Title>
        <Paragraph>
          Built-in chat tooling lets compliance teams interrogate any lease, escalate findings, and track responses directly from the stored record.
        </Paragraph>
      </div>
    ),
  },
];

const repositoryHighlights = [
  {
    icon: <DatabaseZap size={18} />,
    title: 'Chat2DB lease warehouse',
    description: 'Every upload is preserved with version history, embeddings, and metadata for instant reuse.',
  },
  {
    icon: <MessageCircle size={18} />,
    title: 'Natural language Q&A',
    description: 'Collaborators can ask multi-turn questions and receive statute-cited answers with clause snippets.',
  },
  {
    icon: <FileSearch size={18} />,
    title: 'Context-aware reporting',
    description: 'Generated summaries, findings, and exports are grounded in the exact lease stored within Chat2DB.',
  },
];

const ratingBreakdown = [
  { label: 'Tenant Protections', value: 92 },
  { label: 'Landlord Obligations Clarity', value: 88 },
  { label: 'Fee Transparency', value: 85 },
  { label: 'Dispute Resolution Balance', value: 80 },
];

const pricingPlans = [
  {
    title: 'Boutique Property Teams',
    price: '$149',
    cadence: 'per month',
    highlights: ['Up to 40 leases / month', 'Stripe subscriptions & invoicing', 'Fairness scoring dashboard'],
    cta: 'Start pilot',
  },
  {
    title: 'Growth Portfolios',
    price: '$389',
    cadence: 'per month',
    highlights: [
      'Unlimited AI compliance reviews',
      'Custom policy packs & workflows',
      'Slack, Teams & PM platform integrations',
    ],
    featured: true,
    cta: 'Book onboarding',
  },
  {
    title: 'Enterprise & REIT',
    price: 'Let’s talk',
    cadence: 'tailored pricing',
    highlights: ['Dedicated compliance architect', 'Private Qdrant deployment', 'SAML/SCIM & premium support'],
    cta: 'Contact sales',
  },
];

const testimonials = [
  {
    name: 'Morgan Ellis',
    role: 'Director of Compliance · Aspen Peaks Realty',
    quote:
      'Colorado Lease Check removed weeks of manual redlines. We deliver statute-cited reports to counsel in hours while keeping tenant fairness front-and-center.',
  },
  {
    name: 'Raj Patel',
    role: 'VP Operations · Mile High Multifamily',
    quote:
      'Our Stripe reconciliation is automatic, and the Qdrant knowledge base lets asset managers query any lease like it was written yesterday.',
  },
];

const faqItems = [
  {
    key: 'upload',
    label: 'How are leases secured once uploaded?',
    children: (
      <Paragraph type="secondary">
        Files are encrypted in transit and at rest. We isolate Qdrant collections per organization and maintain immutable audit
        logs for every ingestion, transformation, and generated report.
      </Paragraph>
    ),
  },
  {
    key: 'accuracy',
    label: 'What powers the compliance analysis?',
    children: (
      <Paragraph type="secondary">
        Colorado-specific policy engines cross-reference municipal, state, and federal regulations. We pair deterministic rules
        with LLM clause summaries, delivering citations back to the exact lease language.
      </Paragraph>
    ),
  },
  {
    key: 'chat2db',
    label: 'How does Chat2DB support ongoing conversations?',
    children: (
      <Paragraph type="secondary">
        Chat2DB stores the authoritative lease text, embeddings, and generated findings. Interactive chats retrieve context from that warehouse so every answer is auditable, cited, and exportable for compliance reviews.
      </Paragraph>
    ),
  },
  {
    key: 'stripe',
    label: 'Can I customize billing and tenant pass-through fees?',
    children: (
      <Paragraph type="secondary">
        Yes. Stripe Billing lets you create property-level plans, configure pass-through charges for tenants, and export payout
        schedules to your accounting platform.
      </Paragraph>
    ),
  },
];

const ColoradoLeaseCheckPage: React.FC = () => {
  return (
    <div className={styles.page}>
      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
          <Tag color="gold" className={styles.pillTag}>
            Built for Colorado property teams
          </Tag>
          <Title className={styles.heroTitle}>Colorado Lease Check</Title>
          <Paragraph className={styles.heroSubtitle}>
            A professional compliance cockpit that captures every lease inside Chat2DB, automates analysis, delivers regulator-ready reports, and supports tenant fairness conversations.
          </Paragraph>
          <div className={styles.heroActions}>
            <Button type="primary" size="large">
              Start Free Trial
            </Button>
            <Button size="large" ghost>
              Schedule Demo
            </Button>
          </div>
          <div className={styles.heroMetrics}>
            <div>
              <Text className={styles.metricNumber}>2.5x</Text>
              <Text type="secondary">Faster compliance turnaround</Text>
            </div>
            <div>
              <Text className={styles.metricNumber}>99.9%</Text>
              <Text type="secondary">Secure document uptime</Text>
            </div>
            <div>
              <Text className={styles.metricNumber}>48 hrs</Text>
              <Text type="secondary">Audit-ready reporting</Text>
            </div>
          </div>
        </div>
        <Card className={styles.summaryCard}>
          <Title level={4}>Compliance snapshot</Title>
          <Paragraph>
            Upload a lease and Colorado Lease Check instantly highlights rent escalations, habitability clauses, and statutory disclosures that require action.
          </Paragraph>
          <Timeline items={timelineItems} />
        </Card>
      </div>

      <section className={styles.featureSection}>
        <Title level={3}>Everything you need to stay compliant</Title>
        <Paragraph type="secondary" className={styles.sectionSubtitle}>
          From sign-up through renewal, Colorado Lease Check orchestrates a secure, auditable workflow with enterprise guardrails.
        </Paragraph>
        <Row gutter={[24, 24]}>
          {featureCards.map((feature) => (
            <Col key={feature.title} xs={24} sm={12} lg={8}>
              <Card className={styles.featureCard} bordered={false}>
                <div className={styles.featureIcon}>{feature.icon}</div>
                <Title level={4}>{feature.title}</Title>
                <Paragraph type="secondary">{feature.description}</Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      <section className={styles.workflowSection}>
        <Title level={3}>Onboard & review in five streamlined steps</Title>
        <Steps
          current={4}
          responsive
          items={workflowSteps.map((step) => ({
            title: step.title,
            description: step.description,
          }))}
        />
      </section>

      <section className={styles.repositorySection}>
        <Row gutter={[32, 32]} align="middle">
          <Col xs={24} lg={11}>
            <Title level={3}>Lease repository + conversation workspace</Title>
            <Paragraph type="secondary">
              Colorado Lease Check uses Chat2DB and Qdrant as the system of record so your team can move from upload to conversation without context switching. Every finding, follow-up, and export is grounded in the authoritative lease copy.
            </Paragraph>
            <ul className={styles.repositoryList}>
              {repositoryHighlights.map((item) => (
                <li key={item.title}>
                  <span className={styles.repositoryIcon}>{item.icon}</span>
                  <div>
                    <Text strong>{item.title}</Text>
                    <Paragraph type="secondary">{item.description}</Paragraph>
                  </div>
                </li>
              ))}
            </ul>
          </Col>
          <Col xs={24} lg={13}>
            <Card className={styles.repositoryCard} bordered={false}>
              <div className={styles.chatWindow}>
                <div className={`${styles.chatBubble} ${styles.chatBubbleUser}`}>
                  <Text strong>Property Manager</Text>
                  <Paragraph type="secondary">
                    Does this lease violate Denver security deposit rules and what remediation should we send the tenant?
                  </Paragraph>
                </div>
                <div className={`${styles.chatBubble} ${styles.chatBubbleSystem}`}>
                  <Text strong>Colorado Lease Check</Text>
                  <Paragraph type="secondary">
                    The deposit exceeds the statutory 1-month rent limit (Denver Municipal Code §38-12-101). Recommend issuing an amended clause with the compliant cap and updated return timeline within 30 days.
                  </Paragraph>
                  <Tag color="blue">Source: Section 5 · Security Deposits</Tag>
                </div>
                <div className={`${styles.chatBubble} ${styles.chatBubbleUser}`}>
                  <Text strong>Property Manager</Text>
                  <Paragraph type="secondary">Generate a fairness summary I can email to the tenant.</Paragraph>
                </div>
                <div className={`${styles.chatBubble} ${styles.chatBubbleSystem}`}>
                  <Text strong>Colorado Lease Check</Text>
                  <Paragraph type="secondary">
                    Drafted a fairness note referencing Colorado SB23-184. Ready to export as PDF or share via secure link.
                  </Paragraph>
                  <Tag color="success">Report ready</Tag>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </section>

      <section className={styles.analyticsSection}>
        <Row gutter={[32, 32]} align="middle">
          <Col xs={24} lg={12}>
            <Card className={styles.analyticsCard}>
              <div className={styles.analyticsHeader}>
                <div className={styles.analyticsBadge}>
                  <ClipboardList size={18} />
                  <Text>Compliance & Risk Reporting</Text>
                </div>
                <Tag color="processing">Live sync</Tag>
              </div>
              <Title level={4}>Portfolio command center</Title>
              <Paragraph type="secondary">
                Monitor compliance posture across assets, export regulator-ready packets, and subscribe stakeholders to anomaly alerts.
              </Paragraph>
              <Timeline
                mode="left"
                items={[
                  {
                    color: 'green',
                    label: 'Today',
                    children: (
                      <div>
                        <Text strong>Tenant fairness score climbed to 88</Text>
                        <Paragraph type="secondary">
                          Lease addendum aligned late fees with Colorado SB23-184 caps.
                        </Paragraph>
                      </div>
                    ),
                  },
                  {
                    color: 'red',
                    label: 'Yesterday',
                    children: (
                      <div>
                        <Text strong>Security deposit clause flagged</Text>
                        <Paragraph type="secondary">
                          Requires explicit return timeline; remediation assigned to legal.
                        </Paragraph>
                      </div>
                    ),
                  },
                  {
                    color: 'blue',
                    label: 'Last Week',
                    children: (
                      <div>
                        <Text strong>Portfolio compliance coverage</Text>
                        <Paragraph type="secondary">94% leases cleared with no high severity findings.</Paragraph>
                      </div>
                    ),
                  },
                ]}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card className={styles.ratingCard}>
              <div className={styles.ratingHeader}>
                <Star size={22} />
                <Title level={4} className={styles.ratingTitle}>
                  Tenant fairness rating
                </Title>
              </div>
              <Paragraph type="secondary">
                See how each agreement measures up against Colorado tenant protections and best practices for equitable obligations.
              </Paragraph>
              <div className={styles.ratingScore}>
                <Text className={styles.ratingValue}>88</Text>
                <Text type="secondary">out of 100</Text>
              </div>
              <div className={styles.ratingBreakdown}>
                {ratingBreakdown.map((item) => (
                  <div key={item.label} className={styles.ratingItem}>
                    <Text>{item.label}</Text>
                    <Progress percent={item.value} showInfo={false} strokeColor="#3f6adb" />
                    <Text type="secondary">{item.value}/100</Text>
                  </div>
                ))}
              </div>
            </Card>
          </Col>
        </Row>
      </section>

      <section className={styles.securitySection}>
        <Row gutter={[32, 32]} align="middle">
          <Col xs={24} md={12}>
            <Title level={3}>Enterprise-grade data governance</Title>
            <Paragraph type="secondary">
              Colorado Lease Check encrypts every artifact in transit and at rest. Documents, vector embeddings, and generated summaries live in isolated tenants with continuous monitoring.
            </Paragraph>
            <ul className={styles.securityList}>
              <li>
                <ShieldCheck size={18} /> SOC 2 aligned controls and full audit trails.
              </li>
              <li>
                <DatabaseZap size={18} /> Qdrant vector storage for compliant Retrieval Augmented Generation.
              </li>
              <li>
                <CreditCard size={18} /> Stripe Radar fraud monitoring and SCA-ready checkout flows.
              </li>
            </ul>
            <Button type="primary" size="large">
              Talk to compliance specialist
            </Button>
          </Col>
          <Col xs={24} md={12}>
            <Card className={styles.integrationCard}>
              <Title level={4}>Integrations & extensibility</Title>
              <Paragraph type="secondary">
                Sync with property management platforms, deliver findings to Slack or Teams, and pipe normalized data into your BI stack.
              </Paragraph>
              <Row gutter={[16, 16]}>
                {['AppFolio', 'Yardi', 'Salesforce', 'Snowflake'].map((integration) => (
                  <Col xs={12} key={integration}>
                    <div className={styles.integrationItem}>{integration}</div>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        </Row>
      </section>

      <section className={styles.pricingSection}>
        <Title level={3}>Pricing that scales with your portfolio</Title>
        <Paragraph type="secondary" className={styles.sectionSubtitle}>
          Launch with a guided pilot or roll out across every property team. Each plan includes onboarding, historical lease
          migration, and compliance workflow tuning.
        </Paragraph>
        <Row gutter={[24, 24]}>
          {pricingPlans.map((plan) => (
            <Col xs={24} md={8} key={plan.title}>
              <Card className={`${styles.planCard} ${plan.featured ? styles.featuredPlan : ''}`} bordered={false}>
                <Tag icon={plan.featured ? <Star size={16} /> : <CreditCard size={16} />} color={plan.featured ? 'gold' : 'blue'}>
                  {plan.featured ? 'Most popular' : 'Flexible billing'}
                </Tag>
                <Title level={4}>{plan.title}</Title>
                <div className={styles.planPrice}>
                  <span>{plan.price}</span>
                  <Text type="secondary">{plan.cadence}</Text>
                </div>
                <ul className={styles.planFeatureList}>
                  {plan.highlights.map((item) => (
                    <li key={item}>
                      <ShieldCheck size={16} /> {item}
                    </li>
                  ))}
                </ul>
                <Button type={plan.featured ? 'primary' : 'default'} size="large">
                  {plan.cta}
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      <section className={styles.testimonialSection}>
        <Card bordered={false} className={styles.testimonialCard}>
          <div className={styles.testimonialHeader}>
            <Users size={24} />
            <Title level={4} className={styles.testimonialTitle}>
              Colorado operators trust Colorado Lease Check
            </Title>
          </div>
          <List
            itemLayout="vertical"
            dataSource={testimonials}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar style={{ background: '#3f6adb' }}>{item.name.charAt(0)}</Avatar>}
                  title={item.name}
                  description={item.role}
                />
                <Paragraph className={styles.testimonialQuote}>
                  “{item.quote}”
                </Paragraph>
              </List.Item>
            )}
          />
        </Card>
      </section>

      <section className={styles.faqSection}>
        <Title level={3}>Frequently asked questions</Title>
        <Paragraph type="secondary" className={styles.sectionSubtitle}>
          Everything from document custody to Stripe billing policies—if you need more detail our compliance specialists can walk
          you through the program.
        </Paragraph>
        <Collapse
          bordered={false}
          defaultActiveKey={['upload']}
          expandIconPosition="end"
          items={faqItems.map((item) => ({
            key: item.key,
            label: (
              <div className={styles.faqLabel}>
                {item.key === 'upload' && <KeyRound size={18} />}
                {item.key === 'accuracy' && <FileText size={18} />}
                {item.key === 'chat2db' && <MessageCircle size={18} />}
                {item.key === 'stripe' && <CreditCard size={18} />}
                <span>{item.label}</span>
              </div>
            ),
            children: item.children,
          }))}
        />
      </section>

      <footer className={styles.footer}>
        <div>
          <Title level={4}>Ready to modernize lease compliance?</Title>
          <Paragraph type="secondary">
            Launch Colorado Lease Check in days, not months. Our specialists will help migrate existing leases into Qdrant and configure policy packs tailored to your risk appetite.
          </Paragraph>
        </div>
        <div className={styles.footerActions}>
          <Button type="primary" size="large">
            Create account
          </Button>
          <Button size="large" ghost>
            Contact sales
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default ColoradoLeaseCheckPage;
