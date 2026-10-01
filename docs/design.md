# Trishakti HR Design System

This document describes the native Figma structure and the implementation contract for the Trishakti HR interface.

## Source of Truth

Figma file: [trishakti_hr](https://www.figma.com/design/5SB0Ob4nxl1KEAqDVPz0EF/trishakti_hr)

The visual design is the source of truth. Structural cleanup must not change existing content, colors, typography, spacing, layout, information hierarchy, or user flow unless an obvious structural defect requires it.

## Figma Pages

### 01 - Trishakti HR Screens

The existing application screens are organized by product area:

- Dashboard / HR Overview
- Recruitment / Job Management
- Candidates / Pipeline
- Recruitment / New Job
- CV Screening / Ranking
- CV Screening / Candidate Analysis
- Interviews / Management
- Recruitment / Communication
- Recruitment / Offer Generation
- Onboarding / Candidate
- Employees / Employee Record
- Public Application / Confirmation
- Public Careers / Job Details
- Public Careers / Open Positions
- 404 page

Confirmation, dropdown, menu, pagination, status, progress, document, avatar, and match-score states are represented inside the relevant screen frames. They should not be duplicated as invented pages.

### Trishakti HR UI Library

This local library page contains shared foundations and reusable components. It is intentionally local because the Figma Starter plan does not provide published team libraries.

## Application Shell

Where the screen contains the shared HR shell, the intended hierarchy is:

```text
Application Shell
├── Sidebar
│   ├── Brand Area
│   ├── Navigation List
│   └── User Profile
├── Header
└── Main Content
    ├── Page Header
    ├── Filters / Search
    ├── Content Sections
    └── Pagination
```

Public careers and application-confirmation screens may use a different shell or suppress the HR shell. This difference is intentional and should be preserved.

## Design Tokens

The Figma library uses one Starter-plan variable mode named `Mode 1`.

### Color Collections

Primitive colors include ivory, white, navy, green, amber, red, and gray values. Semantic aliases are used for:

- `color/bg/canvas`
- `color/bg/surface`
- `color/text/primary`
- `color/text/secondary`
- `color/text/inverse`
- `color/action/primary`
- `color/action/primary-hover`
- `color/status/success`
- `color/status/warning`
- `color/status/danger`
- `color/border/default`

Use semantic names in components. Do not add a new raw color when an existing semantic token describes the same role.

### Spacing

The spacing scale is:

```text
xs   4
sm   8
md   12
lg   16
xl   24
2xl  32
```

### Radius

```text
none  0
sm    4
md    8
lg    12
full  999
```

### Typography

The library uses Inter styles:

```text
Display    32 / 40  Bold
Heading 1  24 / 32  Bold
Heading 2  18 / 24  Semi Bold
Body       14 / 20  Regular
Label      12 / 16  Medium
Caption    11 / 16  Regular
```

## Component Library

The component library follows shadcn/ui conventions while remaining native to the Figma file.

### Core Components

- `Button`: Primary, Secondary, Ghost, Default, Hover, and Disabled variants
- `Badge`: Success, Warning, Danger, and Neutral status variants
- `Input`: Default, Focus, Error, and Disabled states
- `Summary Card`: dashboard metrics and operational totals
- `Table Row`: candidate and job records with status and action slots
- `Icon/Plus`, `Icon/Search`, and `Icon/Check`

Buttons expose editable label text, a show/hide icon property, and an icon instance-swap property. New icons should follow the same vector-based pattern and use Lucide-compatible geometry where possible.

### HR Patterns

Use the existing screen structures for these product patterns:

- Candidate table and candidate row
- Job card and job row
- Screening score and matching-skill indicators
- Interview row and interview status
- Offer stepper and offer actions
- Onboarding progress and document checklist
- Employee profile and details grid
- Confirmation content and public-career metadata

Only create a new component when the pattern repeats or has meaningful states. Do not create components for one-off decoration.

## Naming Rules

Use semantic hierarchical names:

```text
Button / Primary
Input / Error
Navigation / Item / Active
Status / Shortlisted
Candidate / Table Row
Document Row / Uploaded
Dropdown / Time Range
Modal / Confirmation
```

Avoid names such as `Frame 123`, `Group 45`, `Rectangle 9`, `Text 18`, or `Component 3` when the layer's role is clear.

## Layout Rules

- Preserve the current desktop and public-facing layouts.
- Use Auto Layout for buttons, rows, lists, forms, cards, headers, sidebars, and modal content when their relationships are clearly flexible.
- Use fixed dimensions only when the design visibly requires a fixed control, icon, or board region.
- Keep text as editable text layers.
- Keep icons as vectors or component instances.
- Do not flatten tables, forms, candidates, or status information into images.
- Do not add new navigation items, pages, fields, statuses, or workflows without an approved design source.

## Code Mapping

The intended frontend mapping is:

```text
Figma component       React implementation
Button                shadcn-style Button + Lucide icon slot
Input                 shadcn-style Input
Badge                 shadcn-style Badge
Summary Card          HR metric component
Table Row             data-table row component
Navigation Item       sidebar navigation component
Dropdown              Select / DropdownMenu pattern
Modal                 Dialog pattern
Toast                 Toast or alert pattern
```

Use Tailwind-compatible token names in code and keep component behavior aligned with the Figma states. Lucide React is the preferred icon source for the frontend.

## Accessibility

- Keep visible labels for important form fields.
- Do not rely on color alone for status.
- Preserve clear focus states for keyboard users.
- Use meaningful button labels and accessible names for icon-only controls.
- Keep status and error text readable against its background.

## Review Checklist

Before changing a Figma screen or component:

- Confirm the layer represents an existing product element.
- Preserve the current visual appearance.
- Use an existing token before creating a new one.
- Use an existing component before creating a new one.
- Keep the text editable.
- Keep vectors editable.
- Validate the screen after structural changes.
- Do not include secrets, credentials, tokens, private HR records, or personal files in the design file or documentation.
