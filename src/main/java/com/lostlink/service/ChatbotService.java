package com.lostlink.service;

import java.util.Locale;

import org.springframework.stereotype.Service;

@Service
public class ChatbotService {

    /**
     * Intelligent keyword-matching and context-aware response engine the LOSTL
     * NK expert site guide.
     */
    public String getExpertGuideResponse(String rawMessage) {
        if (rawMessage == null || rawMessage.trim().isEmpty()) {
            return "Hello! I am your **LOSTLINK Expert Guide**. How can I help you today? You can ask me how to report an item, how to contact finders directly by phone or email, how to search items, or how to leave feedback.";
        }

        String msg = rawMessage.toLowerCase(Locale.ENGLISH).trim();

        // 1. Greetings & Identity
        if (matchesAny(msg, "hello", "hi", "hey", "who are you", "what can you do", "help", "guide", "start")) {
            return """
                   \ud83d\udc4b Welcome to **LOSTLINK**! I am your **Expert Site Guide**.
                   
                   I can guide you through every feature of the platform:
                   \u2022 **Report Item**: How to list lost or found items
                   \u2022 **Instant Direct Contact**: How to reach owners/finders directly via phone and email
                   \u2022 **Search & Filters**: How to find items by keyword, category, or location
                   \u2022 **Secure Messaging**: How to contact finders and claim items
                   \u2022 **Feedback & Ratings**: How to review and rate the platform
                   
                   What would you like to know more about?""";
        }

        // 2. Direct Contact & Verification
        if (matchesAny(msg, "secret question", "secret", "fraud", "ownership", "challenge", "verification", "security", "protect", "fake claim", "scam", "phone", "email", "direct contact")) {
            return """
                   \ud83d\udcde **Direct Contact & Safe Handover**
                   
                   LOSTLINK connects owners and finders instantly without complicated verification hurdles:
                   
                   1. **Direct Phone & Email**: Every item card displays the verified reporter's phone number and email address directly.
                   2. **One-Tap Actions**: Tap the phone number to call immediately or the email link to draft an email.
                   3. **In-App Messaging**: You can also use the built-in *'Contact Poster'* button to send a message.
                   
                   \ud83d\udca1 *Tip: For safe item returns, always arrange handovers in public, well-lit campus or workplace areas.*""";
        }

        // 3. Reporting Lost or Found Items
        if (matchesAny(msg, "report", "post item", "new listing", "found an item", "lost an item", "create item", "how to report", "submit item", "publish")) {
            return """
                    📝 **How to Report a Lost or Found Item**

                    To publish a new listing on LOSTLINK:

                    1. **Click '+ Report Item'** in the top navigation bar (or mobile menu).
                    2. **Select Report Type**:
                       • 🔴 *'I Lost This'* — if you are searching for a missing item.
                       • 🟢 *'I Found This'* — if you found someone else's property.
                    3. **Enter Details**:
                       • **Title**: Short, descriptive name (e.g., *'Blue Hydroflask 32oz'*).
                       • **Category**: Choose from Electronics, Documents, Wallets, Keys, etc.
                       • **Location**: Precise place (e.g., *'Science Library, 2nd Floor'*).
                       • **Description**: Distinguishing marks, model numbers, or timestamps.
                       • **Photo** *(optional)*: Upload a photo or provide an image link.
                    4. Click **'Publish Listing'**! Your item will appear immediately on the Home Feed with your contact info for instant connection.

                    ⚠️ *Note: You must be signed in with your account to publish listings.*""";
        }

        // 4. Messaging & Contacting Finders / Claiming
        if (matchesAny(msg, "message", "contact", "chat", "reach out", "claim item", "talk to finder", "talk to owner", "how to contact")) {
            return """
                   \ud83d\udcac **How to Contact Finders & Claim Items**
                   
                   Connecting with item finders or owners is secure and seamless:
                   
                   1. Locate the item card on the **Home Feed**.
                   2. Click **'View Details & Claim'** to open the modal.
                   3. Review the description, location, and reporter info.
                   4. Click **'Contact Finder'** (or *'Contact Reporter'*).
                   5. Enter your message with additional proof of ownership or coordinate a safe campus meeting spot.
                   6. The message is dispatched securely to the reporter's account.
                   
                   \ud83d\udee1\ufe0f *Security Reminder: Always arrange handovers in public, well-lit campus or workplace areas.*""";
        }

        // 5. Search, Filters & Navigation
        if (matchesAny(msg, "search", "filter", "find item", "category", "location filter", "sort", "pagination", "keywords")) {
            return """
                   \ud83d\udd0d **Search & Filtering Guide**
                   
                   Find lost belongings quickly using our dynamic filtering system:
                   
                   \u2022 **Keyword Search**: Type an item name, brand, or color into the search bar and press Enter.
                   \u2022 **Item Type Filter**: Toggle between **'All Items'**, **'Lost Only'**, or **'Found Only'**.
                   \u2022 **Category Dropdown**: Filter by Electronics, Documents & IDs, Wallets & Bags, Keys & Cards, Books, and more.
                   \u2022 **Location Search**: Filter by building or spot (e.g., *'Library'*, *'Cafeteria'*, *'Gym'*).
                   \u2022 **Status Filter**: Switch between **'Open'** (active listings) and **'Resolved'** (successfully returned items).
                   \u2022 **Reset**: Click the **'Reset Filters'** button to restore the full community feed.""";
        }

        // 6. Feedback & Ratings
        if (matchesAny(msg, "feedback", "rating", "review", "star", "rate", "comments", "testimonial")) {
            return """
                   \u2b50 **Feedback & Community Ratings Module**
                   
                   We love hearing from our community! Here is how to share your thoughts:
                   
                   1. Click **'Feedback'** with the star icon in the top navbar.
                   2. **Select Star Rating**: Click any star from 1 to 5 (Needs Improvement to Excellent!).
                   3. Enter your **Name**, **Email**, and **Comments** describing your experience.
                   4. Click **'Submit Feedback'** for instant toast confirmation.
                   5. Click **'View Community Ratings'** inside the modal to view aggregate rating scores and feedback from fellow users!""";
        }

        // 7. My Posts / Item Status Management
        if (matchesAny(msg, "my posts", "my items", "my listings", "resolve", "resolved", "mark resolved", "delete")) {
            return """
                   \ud83d\udcc1 **Managing 'My Posts' & Marking Resolved**
                   
                   \u2022 **Accessing My Posts**: Click **'My Posts'** in the top navbar after signing in to view listings you created.
                   \u2022 **Mark as Resolved**: When a lost item is successfully recovered or returned to its rightful owner, click **'Mark as Resolved'** on the item card.
                   \u2022 This updates the status from `OPEN` to `RESOLVED`, indicating to the community that the item is no longer missing!""";
        }

        // 8. Authentication & Accounts
        if (matchesAny(msg, "sign in", "login", "register", "sign up", "account", "jwt", "token", "password", "logout")) {
            return """
                   \ud83d\udc64 **User Account & Authentication**
                   
                   \u2022 **Sign In**: Click **'Sign In'** in the navbar and enter your registered email and password.
                   \u2022 **Get Started (Register)**: Click **'Get Started'** to register with your Name, Email, Phone, and Password.
                   \u2022 **Security**: Authentication uses stateless **JWT (JSON Web Tokens)** stored securely in your browser.
                   \u2022 **Logout**: Click the exit icon next to your avatar in the navbar anytime to log out.""";
        }

        // 9. Technologies & Course Stack
        if (matchesAny(msg, "technology", "tech stack", "stack", "java", "spring boot", "mysql", "backend", "jpa", "hibernate")) {
            return """
                   \ud83d\udcbb **LOSTLINK Technology Architecture**
                   
                   LOSTLINK is built using enterprise course-approved technologies:
                   
                   \u2022 **Backend Framework**: Spring Boot 3 (Java 17+)
                   \u2022 **Database**: MySQL 8+ with automated schema management
                   \u2022 **Persistence**: Spring Data JPA & Hibernate ORM
                   \u2022 **Security**: Spring Security with Stateless JWT Authentication & BCrypt Password Encryption
                   \u2022 **Frontend**: HTML5, Vanilla JavaScript, and Tailwind CSS
                   \u2022 **REST Architecture**: Clean RESTful endpoints under `/api/**`""";
        }

        // 10. Fallback Guidance with Direct UI Pointers
        return """
               \ud83e\udd16 I couldn't find an exact match for your question, but I am here to help you navigate LOSTLINK!
               
               Here are some popular topics you can ask me about:
               \u2022 *'How do I report a lost or found item?'*
               \u2022 *'How do direct phone and email contacts work?'*
               \u2022 *'How do I search or filter items?'*
               \u2022 *'How do I contact someone who found my item?'*
               \u2022 *'Where can I submit feedback and ratings?'*
               
               \ud83d\udca1 You can also use the top navigation bar to explore **Home Feed**, **Report Item**, or **Feedback** directly!""";
    }

    private boolean matchesAny(String input, String... keywords) {
        for (String kw : keywords) {
            if (input.contains(kw)) {
                return true;
            }
        }
        return false;
    }
}
