
# National Staff Wellbeing Survey - Work in Progress

## Application Overview

The National Staff Wellbeing Survey is a comprehensive platform designed to help educational institutions assess, monitor, and improve staff wellbeing through customisable surveys and data-driven insights. This application enables school administrators to create wellbeing surveys, distribute them to staff members, collect responses, analyse results, and implement targeted improvement strategies based on the findings.

The platform is built with a focus on ease of use, data security, and actionable insights, allowing educational leaders to make informed decisions about staff welfare initiatives. By addressing wellbeing proactively, schools can improve staff retention, enhance workplace satisfaction, and ultimately create better learning environments.

## Features and Functionality

### User Authentication and Management
- **Secure user registration and login**: Supports email-based authentication with password recovery
- **Profile management**: Users can update personal and professional details, including school information
- **Role-based access control**: Different permission levels for administrators, organization admins, editors, and viewers

### Survey Management
- **Survey creation**: Intuitive interface to create customised wellbeing surveys
- **Scheduling**: Set future dates for survey distribution and automatic closing
- **Custom questions**: Add organisation-specific questions to standard wellbeing assessment
- **Distribution options**: Send surveys via email with automated reminders or share through unique links
- **Survey status tracking**: Monitor surveys as they progress through states (Saved, Scheduled, Sent, Completed, Archived)

### Response Collection
- **Anonymous feedback**: Staff can provide honest feedback without identification concerns
- **Multi-device compatibility**: Responsive design works across desktop and mobile devices
- **Progress tracking**: View response rates and completion statistics

### Data Analysis
- **Real-time analytics**: View survey results as they come in
- **Benchmark comparisons**: Compare results against industry standards
- **Historical trending**: Track changes in wellbeing metrics over time
- **Customisable reports**: Generate targeted reports based on specific wellbeing dimensions

### Action Planning
- **Actionable insights**: Translate survey data into practical improvement strategies
- **Progress tracking**: Monitor the implementation of wellbeing initiatives
- **Collaboration tools**: Share action plans with relevant stakeholders

### Team Collaboration
- **Organization structure**: Create and manage multi-level organizational structures
- **Member invitations**: Invite colleagues to join the platform with specific roles
- **Shared access**: Collaborate on surveys and action plans within your organization

### Subscription and Payment
- **Tiered subscription plans**: Foundation, Progress, and Premium options with varying features
- **Secure payment processing**: Integration with Stripe for subscription management
- **Invoice management**: Generate and track invoices, with optional Xero integration

## Architecture

### Directory Structure

```
/
├── public/                      # Static assets
├── src/
│   ├── App.tsx                  # Main application component
│   ├── App.css                  # Global styles
│   ├── components/              # Reusable UI components
│   │   ├── action-plan/         # Action planning components
│   │   ├── admin/               # Admin panel components
│   │   ├── auth/                # Authentication components
│   │   ├── custom-questions/    # Custom survey questions
│   │   ├── dashboard/           # Dashboard UI components
│   │   ├── improve/             # Improvement plan components
│   │   ├── invitation/          # Team invitation components
│   │   ├── layout/              # Layout components (header, footer, etc.)
│   │   ├── onboarding/          # User onboarding flows
│   │   ├── organization/        # Organization management
│   │   ├── stripe/              # Payment integration components
│   │   ├── survey-form/         # Survey form components
│   │   ├── surveys/             # Survey management components
│   │   ├── team/                # Team management components
│   │   ├── ui/                  # Basic UI components (buttons, inputs, etc.)
│   │   └── upgrade/             # Subscription upgrade components
│   ├── contexts/                # React context providers
│   │   ├── AuthContext.tsx      # Authentication state
│   │   ├── OrganizationContext.tsx # Organization state
│   │   ├── StripeContext.tsx    # Payment integration state
│   │   └── TestingModeContext.tsx # Testing mode for development
│   ├── hooks/                   # Custom React hooks
│   │   ├── usePermissions.tsx   # Permission management
│   │   ├── useRoleManagement.tsx # Role-based access control
│   │   └── [other hooks]        # Various utility hooks
│   ├── integrations/            # External service integrations
│   │   └── supabase/            # Supabase client & types
│   ├── lib/                     # Library code and utilities
│   │   └── supabase/            # Supabase client configuration
│   ├── pages/                   # Page components
│   │   ├── Dashboard.tsx        # Main dashboard page
│   │   ├── Surveys.tsx          # Survey management page
│   │   ├── Analysis.tsx         # Survey analysis page
│   │   ├── Improve.tsx          # Improvement plans page
│   │   └── [other pages]        # Additional application pages
│   ├── services/                # Service layer for API interactions
│   ├── types/                   # TypeScript type definitions
│   └── utils/                   # Utility functions
│       ├── survey/              # Survey-related utilities
│       ├── types/               # Type definitions
│       └── [other utils]        # Misc utilities
├── supabase/                    # Supabase configuration
│   └── functions/               # Edge functions for server-side logic
└── [configuration files]        # Project configuration files
```

### System Architecture

```
+--------------------------------------------+
|                                            |
|            React Web Application           |
|                                            |
+-------------------+------------------------+
                    |
                    v
+-------------------+------------------------+
|                                            |
|         Supabase Authentication            |
|                                            |
+-------------------+------------------------+
                    |
                    v
+--------+----------+-----------+------------+
|        |                      |            |
| React  |     Supabase         | Supabase   |
| Query  |     Database         | Edge       |
| Cache  |                      | Functions  |
|        |                      |            |
+--------+----------+-----------+------------+
                    |
                    v
+-------------------+------------------------+
|                                            |
|         External Integrations              |
| (Stripe, Hubspot, Xero, Email Services)    |
|                                            |
+--------------------------------------------+
```

### Process Flow Architecture

```
+----------------+          +----------------+          +----------------+
|                |          |                |          |                |
|    User Auth   +--------->+  Survey        +--------->+  Response      |
|    Flows       |          |  Creation      |          |  Collection    |
|                |          |                |          |                |
+-------+--------+          +-------+--------+          +-------+--------+
        ^                           |                           |
        |                           v                           v
+-------+--------+          +-------+--------+          +-------+--------+
|                |          |                |          |                |
|  User & Org    |<---------+  Analysis &    |<---------+  Action        |
|  Management    |          |  Reporting     |          |  Planning      |
|                |          |                |          |                |
+-------+--------+          +----------------+          +----------------+
        |
        v
+-------+--------+
|                |
|  Subscription  |
|  Management    |
|                |
+----------------+
```

### Third-Party Integration Architecture

```
+---------------------+
|                     |
|  Web Application    |
|                     |
+--------+------------+
         |
         v
+--------+------------+
|                     |
|  Supabase           |
|  Edge Functions     |
|                     |
+--------+------------+
         |
         |    +---------------+    +--------------+
         +--->+ Stripe        +--->+ Payment      |
         |    | Integration   |    | Processing   |
         |    +---------------+    +--------------+
         |
         |    +---------------+    +--------------+
         +--->+ Email Service +--->+ Survey       |
         |    | Integration   |    | Distribution |
         |    +---------------+    +--------------+
         |
         |    +---------------+    +--------------+
         +--->+ Hubspot       +--->+ Marketing &  |
         |    | Integration   |    | CRM          |
         |    +---------------+    +--------------+
         |
         |    +---------------+    +--------------+
         +--->+ Xero          +--->+ Accounting & |
              | Integration   |    | Invoicing    |
              +---------------+    +--------------+
```

## Work Completed

### ✅ Core Application Framework
- [x] React application setup with TypeScript
- [x] Tailwind CSS integration for styling
- [x] Responsive design implementation
- [x] Shadcn UI components library integration
- [x] React Router setup for navigation

### ✅ Authentication System
- [x] User registration and login
- [x] Email confirmation workflow
- [x] Password reset functionality
- [x] Profile management
- [x] Session management

### ✅ Survey Management
- [x] Survey creation interface
- [x] Survey scheduling functionality
- [x] Survey distribution (email and link sharing)
- [x] Custom questions integration
- [x] Survey reminders
- [x] Survey archiving

### ✅ Response Collection
- [x] Survey form interface for participants
- [x] Anonymous response collection
- [x] Multi-page survey form
- [x] Response validation
- [x] Completion confirmation

### ✅ Dashboard
- [x] Overview statistics
- [x] Recent surveys listing
- [x] Response rate tracking
- [x] Getting started guide

### ✅ User Management
- [x] Organization membership system
- [x] Role-based permissions
- [x] Team invitation workflow
- [x] Organization switching

### ✅ Payment Integration
- [x] Stripe payment processing
- [x] Subscription plan management
- [x] Payment history tracking
- [x] Invoice generation

### ✅ External Integrations
- [x] Hubspot integration for marketing
- [x] Email service integration
- [x] Initial Xero integration for accounting

## Work In Progress

### User Experience and Interface
1. Refine responsive layouts for optimal mobile experience
2. Implement accessibility improvements (ARIA attributes, keyboard navigation)
3. Streamline survey creation workflow
4. Enhance form validation with clearer error messages
5. Optimize page load performance

### Survey Features
1. Implement draft saving functionality for surveys
2. Create template gallery for quick survey creation
3. Add bulk email import functionality
4. Enhance survey preview functionality
5. Implement survey duplication feature
6. Add filtering and sorting to survey list

### Analysis and Reporting
1. Develop comprehensive analytics dashboard
2. Create exportable PDF reports
3. Implement advanced filtering for survey results
4. Add visual chart customization options
5. Create comparison view for multiple surveys

### Team and Organization Management
1. Enhance organization hierarchy management
2. Implement department/group tagging for surveys
3. Create permission templates for quicker role assignment
4. Add audit logs for administrative actions

### Subscription and Billing
1. Refine subscription plan features and limits
2. Enhance invoice management interface
3. Complete Xero integration for accounting
4. Implement subscription usage analytics

### Security and Compliance
1. Conduct comprehensive security audit
2. Implement additional data protection measures
3. Create data retention policies
4. Enhance privacy controls for survey responses

### Technical Debt
1. Refactor large components into smaller, focused ones
2. Optimize database queries for performance
3. Enhance error handling and logging
4. Implement comprehensive unit and integration tests

## Future Improvements

1. **AI-Powered Insights Engine**: Implement machine learning algorithms to automatically identify patterns in survey data and generate personalized wellbeing recommendations based on specific school contexts and historical trends.

2. **Benchmark Data Marketplace**: Create an anonymized data marketplace where schools can contribute to and access industry benchmarks based on similar institution types, sizes, and regions, providing deeper contextual analysis.

3. **Wellbeing Journey Mapping**: Develop a visual timeline tool that tracks staff wellbeing metrics over their entire employment journey, identifying critical intervention points and measuring the impact of wellbeing initiatives over time.

4. **Integration with Professional Development Systems**: Connect with existing professional development platforms to correlate wellbeing metrics with training opportunities, helping schools address specific wellbeing challenges through targeted professional growth.

5. **Community-Driven Resource Exchange**: Build a curated marketplace where schools can share successful wellbeing initiatives, resources, and implementation strategies, creating a collaborative ecosystem for institutional learning.

6. **Predictive Staffing Analysis**: Implement predictive analytics to help schools identify potential staffing challenges before they occur, based on wellbeing indicators that correlate with retention and recruitment patterns.

7. **Multi-Stakeholder Ecosystem**: Expand the platform to include interconnected surveys for students, parents, and community members, creating a holistic view of institutional wellbeing across all stakeholders.

8. **Wellbeing Certification Program**: Develop a certification system that recognizes and rewards schools for implementing effective wellbeing programs, creating a competitive differentiator for institutions in recruitment and reputation.

9. **Voice-Based Survey Collection**: Implement voice response technology to make surveys more accessible and potentially gather richer qualitative data through natural conversation rather than traditional form inputs.

10. **Customizable Wellbeing Dashboards for Staff**: Create personalized dashboards for individual staff members to track their own wellbeing metrics over time, access targeted resources, and set personal wellbeing goals linked to institutional support resources.
