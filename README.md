# **CPG Brand Trends Dashboard – MVP PRD**

### **TL;DR**

A lightweight MVP dashboard for Consumer Packaged Goods (CPG) brands that aggregates and visualizes public consumer interest signals. The product enables users to track and compare keywords related to their brands, competitors, and categories across Google Trends and Reddit, providing leading indicators of market demand and consumer conversation. This initial release is focused on trend monitoring, not retail sales analysis or forecasting.


### **Goals**

#### **Business Goals**

- Help emerging and disruptive CPG brands make faster, better-informed marketing and innovation decisions by providing leading indicators of consumer interest.  

- Build an early user pipeline and validate the core hypothesis that public trend data is a valuable complement to traditional retail sales data.

- Demonstrate the value of aggregating disparate public data sources (search and social discussion) into a single, unified view.

- Validate which trend intelligence features users find most valuable to inform future product evolution and expansion to other data sources.


#### **User Goals**

- Quickly understand the public conversation and online interest surrounding a new or existing product.  

- Identify the most relevant keywords, topics, and communities related to their product category.  

- Discover regions or markets where consumer interest in their category is highest or growing fastest.  

- Share or export insights easily with team members and decision-makers.


#### **Non-Goals**

- No direct integration with retail point-of-sale (POS) data from providers like Nielsen, Circana, or SPINS.  

- No demand forecasting (predictive modeling or future sales estimates).

- No integration with "walled garden" platforms like Facebook or TikTok in the MVP due to significant data access restrictions.  

- No deep workflow integrations or custom recommendations beyond the provided trend intelligence.


### **User Stories**

**Primary User Persona:** "Brenda," a Brand Manager at a mid-sized CPG company, and "Alex," a Market Analyst supporting multiple brand teams. Brenda is time-poor and needs quick, actionable insights, while Alex needs reliable data for deeper analysis.  

- As a brand manager, I want to monitor Google search interest and Youtubementions for my new product launch in one dashboard, so I can gauge initial market reception in real-time.

- As a market analyst, I want to compare the search trend trajectory of "mushroom jerky" vs. "vegan jerky," so I can provide data to support our product innovation strategy.  

- As a brand manager, I want to see a geographic heat map of search interest for "sunscreen," so I can optimize my regional marketing spend ahead of the peak season.  

- As a market analyst, I want to receive an email alert when a competitor's brand name experiences a sudden spike in search interest, so I can investigate and react to their marketing campaigns quickly.

- As a brand manager, I want to discover the top "rising" search queries related to my product category, so I can inform our SEO and content strategy with the exact language consumers are using.  


### **Functional Requirements**

#### **Topic & Keyword Management (High Priority)**

- Allow users to create, edit, and delete logical "Keyword Groups" (e.g., "My Brands," "Competitors").

- Allow users to add keywords to a group and specify which data sources (Google Trends, Reddit) to track.

- For Youtubetracking, require users to specify a list of target subreddits to ensure data relevance.


#### **Core Dashboard & Visualization (High Priority)**

- Present data in a customizable, widget-based layout.  

- Feature a primary time-series chart to display and compare trend data for multiple keywords from Google Trends and Reddit.

- Include "scorecard" widgets for key terms showing the latest data point and week-over-week change.

- Provide a geographic heat map widget for Google Trends data to show interest by region.  

- Include a "Related Queries" widget from Google Trends showing "Top" and "Rising" associated searches.  

- Provide a "YoutubeBuzz" widget showing total mention counts and a feed of the most relevant posts.


#### **Data Integration (High Priority)**

- Integrate with a reliable, commercial third-party Google Trends API (e.g., Glimpse, SerpApi) to retrieve search interest data, as no official, stable API exists.  

- Integrate with the official YoutubeData API using mandatory OAuth 2.0 authentication, adhering strictly to rate limits (100 QPM).  


#### **Global Filtering & Controls (Medium Priority)**

- Provide a global date range picker with presets (e.g., Last 30 Days, Last 12 Months) and a custom option.

- Provide a global geography filter to apply to all relevant Google Trends data widgets.


#### **Proactive Alerting System (Medium Priority)**

- Allow users to create a basic email alert for a keyword based on a significant velocity change (e.g., "alert me if interest increases by 50% week-over-week").


### **User Experience**

#### **Entry Point & First-Time User Experience**

- Users access a secure web dashboard via direct link.

- Minimal onboarding—the interface clearly prompts the user to create their first Keyword Group.

- Contextual in-app help icons explain key metrics like "Normalized Interest Score."


#### **Core Experience**

- **Step 1:** User creates a new "Keyword Group" (e.g., "New Product Launch").

- **Step 2:** User adds keywords (product name, competitors, category terms) and configures sources (e.g., adds `r/keto` and `r/fitness` for Youtubetracking).

- **Step 3:** The dashboard populates with widgets: a time-series chart comparing the keywords, scorecards for each, a geo map for the primary term, and a feed of recent Youtubementions.

- **Step 4:** User reviews insights, using the global date and geography filters to analyze seasonal trends or regional hotspots.

- **Step 5:** User sets an email alert to be notified of future spikes in search interest for their product.

- **Step 6:** User exits or creates a new Keyword Group for a different analysis.


#### **Advanced Features & Edge Cases**

- If an external API fails, the relevant widget displays a clear error message without breaking the entire dashboard.

- If no data is found for a term, the system provides a "No data available" message.

- Gracefully handle API rate-limiting from Youtubeby queueing requests and displaying a "loading" state.  


#### **UI/UX Highlights**

- Clean, single-page design with a responsive layout for desktop and tablet.

- High color contrast and consistent use of fonts and layout.  

- Visual clarity is prioritized, using simple charts, heatmaps, and ample whitespace to avoid clutter.  

- Immediate feedback on user actions (e.g., "Keyword added," "Alert saved").


### **Narrative**

Brenda, a brand manager at a growing CPG company, is preparing to launch a new line of keto-friendly snacks. The market is crowded, and she needs to understand the pre-purchase buzz, not just post-sale numbers. She opens the CPG Brand Trends Dashboard and creates a new Keyword Group for her launch. She enters her product name, two key competitors, and category terms like "keto snacks" and "low carb bar." For Reddit, she targets communities like r/keto and r/xxfitness.

Instantly, her dashboard populates. She sees a time-series chart showing that while search interest for "keto snacks" is stable, discussion on Youtubeis climbing. The "Related Queries" widget reveals that users are searching for "keto snacks for work," giving her a new angle for her launch campaign. She sets an alert to be notified if her product's name gets mentioned more than 50 times a day on Reddit. Instead of spending hours manually checking different sites, Brenda has a real-time pulse on consumer interest, equipping her with the leading indicators needed to make her launch a success.


### **Success Metrics**

#### **User-Centric Metrics**

- Daily/weekly active users and number of unique keywords tracked.

- Repeat usage rate (users returning within a week).

- Average number of keywords per user and data sources enabled.

- User satisfaction surveys/NPS (within-app feedback prompts).


#### **Business Metrics**

- Number of engaged brands and unique customer accounts using the MVP.

- Validation of the public-data-as-a-leading-indicator hypothesis.

- Number of feature requests related to new data sources (e.g., TikTok, YouTube).


#### **Technical Metrics**

- System response time for dashboard loads (<3 seconds).

- Data freshness (latency from API source to user view).

- Dashboard uptime and API error rate for external integrations.


### **Tracking Plan**

- Keyword Group created/deleted.

- Keyword added/removed.

- Dashboard widget interaction (e.g., hover, click).

- Filter applied (date range, geography).

- Alert created/triggered.

- Feedback prompt responses.


### **Technical Considerations**

#### **Technical Needs**

- Read-only, API-based integrations with a commercial Google Trends provider and the official YoutubeAPI.

- Secure, scalable web dashboard for all user interactions.

- Server-side logic for data ingestion, normalization, and analytics logging.

- Robust error handling and request queueing for external APIs.


#### **Integration Points**

- Must support a commercial Google Trends API (e.g., Glimpse) for reliable, structured data, as open-source scrapers are not suitable for production.  

- Must support the official YoutubeData API via OAuth 2.0, with diligent management of rate limits.  


#### **Data Storage & Privacy**

- Cache anonymized trend data and usage stats.

- Store user-created Keyword Groups and alert configurations.

- Adhere to data usage agreements from API licensors and privacy standards.


#### **Scalability & Performance**

- Target an initial cohort of 50-100 daily users, with an architecture that can scale horizontally.

- Optimize for fast query responses and smooth UI, even with multiple widgets loading data simultaneously.


#### **Potential Challenges**

- Ensuring data integrity when normalizing a relative index (Google Trends) and an absolute count (Youtubementions).

- Managing the cost and dependency on a third-party Google Trends API provider.

- Risk of future changes to Reddit's API terms or pricing structure.  


### **Milestones & Sequencing**

**Project Estimate:** 4–6 weeks


#### **Suggested Phases**

- **Phase 1: Backend & Data Integration (Week 1-2)**

  - **Key Deliverables:** Establish secure, reliable data ingestion pipelines for the commercial Google Trends API and the YoutubeAPI. Set up the core database schema.

  - **Dependencies:** Final selection and subscription to a commercial Google Trends API provider; Youtubedeveloper app credentials.

- **Phase 2: Core Dashboard & Visualization (Week 2-3)**

  - **Key Deliverables:** Build the front-end dashboard with the primary time-series chart and scorecard widgets. Connect front-end to the backend data pipelines.

  - **Dependencies:** UX mocks for the main dashboard layout.

- **Phase 3: Feature Implementation (Week 3-4)**

  - **Key Deliverables:** Implement keyword and group management, global filtering, and the remaining dashboard widgets (Geo Map, Related Queries, YoutubeBuzz).

  - **Dependencies:** Finalized logic for all widget data.

- **Phase 4: Alerting, Polish & Launch (Week 5-6)**

  - **Key Deliverables:** Build the email alerting system. Implement usage tracking. Conduct internal testing and bug fixing.

  - **Dependencies:** Email delivery service integration.
