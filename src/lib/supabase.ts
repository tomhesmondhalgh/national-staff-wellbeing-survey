
import { createClient } from "@supabase/supabase-js";

// Check if environment variables exist, otherwise use placeholders for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://bagaaqkmewkuwtudwnqw.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhZ2FhcWttZXdrdXd0dWR3bnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2NjQwMzIsImV4cCI6MjA1NjI0MDAzMn0.Eu_xDUDDk188oE0dB7W7KJ4oWjB6nQNuUBBnZUMrsvE";

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// If you need to log conditionally, use this approach
console.info("Initializing Supabase with URL:", supabaseUrl.includes("placeholder") ? "placeholder-url" : supabaseUrl);

// Add a helper method to check if Supabase is configured properly
export const isSupabaseConfigured = () => {
  return supabaseUrl !== "placeholder-url" && supabaseAnonKey !== "placeholder-key";
};

// Helper to check if the current session is authenticated
export const isAuthenticated = async () => {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
};

// ======== DEMO DATA FOR ANALYSIS PAGE ========

// Mock survey options for analysis page
export const getMockSurveyOptions = () => {
  return [
    { id: "survey-2023-autumn", name: "Autumn Term Survey", date: "2023-10-15" },
    { id: "survey-2024-spring", name: "Spring Term Survey", date: "2024-02-10" },
    { id: "survey-2024-summer", name: "Summer Term Survey", date: "2024-06-05" },
  ];
};

// Mock recommendation score data
export const getMockRecommendationScore = (surveyId?: string) => {
  const scores = {
    "survey-2023-autumn": { score: 7.2, nationalAverage: 7.8 },
    "survey-2024-spring": { score: 8.1, nationalAverage: 7.8 },
    "survey-2024-summer": { score: 8.4, nationalAverage: 7.9 },
    "default": { score: 7.9, nationalAverage: 7.8 }
  };
  
  return surveyId && surveyId in scores 
    ? scores[surveyId as keyof typeof scores] 
    : scores.default;
};

// Mock leaving contemplation data
export const getMockLeavingContemplation = (surveyId?: string) => {
  const data = {
    "survey-2023-autumn": {
      "Strongly Agree": 12,
      "Agree": 18,
      "Disagree": 40,
      "Strongly Disagree": 30
    },
    "survey-2024-spring": {
      "Strongly Agree": 8,
      "Agree": 15,
      "Disagree": 42,
      "Strongly Disagree": 35
    },
    "survey-2024-summer": {
      "Strongly Agree": 5,
      "Agree": 10,
      "Disagree": 45,
      "Strongly Disagree": 40
    },
    "default": {
      "Strongly Agree": 8,
      "Agree": 15,
      "Disagree": 42,
      "Strongly Disagree": 35
    }
  };
  
  return surveyId && surveyId in data 
    ? data[surveyId as keyof typeof data] 
    : data.default;
};

// Mock detailed wellbeing responses
export const getMockDetailedResponses = (surveyId?: string) => {
  // Default responses that will be modified based on survey
  const baseResponses = [
    {
      question: "I feel valued as a member of this organisation",
      schoolResponses: {
        "Strongly Agree": 35,
        "Agree": 40,
        "Disagree": 15,
        "Strongly Disagree": 10
      },
      nationalResponses: {
        "Strongly Agree": 30,
        "Agree": 45,
        "Disagree": 15,
        "Strongly Disagree": 10
      }
    },
    {
      question: "Leadership prioritises staff wellbeing",
      schoolResponses: {
        "Strongly Agree": 25,
        "Agree": 35,
        "Disagree": 25,
        "Strongly Disagree": 15
      },
      nationalResponses: {
        "Strongly Agree": 25,
        "Agree": 40,
        "Disagree": 20,
        "Strongly Disagree": 15
      }
    },
    {
      question: "My workload is manageable",
      schoolResponses: {
        "Strongly Agree": 20,
        "Agree": 30,
        "Disagree": 35,
        "Strongly Disagree": 15
      },
      nationalResponses: {
        "Strongly Agree": 15,
        "Agree": 35,
        "Disagree": 35,
        "Strongly Disagree": 15
      }
    },
    {
      question: "I have a good work-life balance",
      schoolResponses: {
        "Strongly Agree": 20,
        "Agree": 30,
        "Disagree": 30,
        "Strongly Disagree": 20
      },
      nationalResponses: {
        "Strongly Agree": 20,
        "Agree": 30,
        "Disagree": 30,
        "Strongly Disagree": 20
      }
    },
    {
      question: "I am in good physical and mental health",
      schoolResponses: {
        "Strongly Agree": 25,
        "Agree": 40,
        "Disagree": 25,
        "Strongly Disagree": 10
      },
      nationalResponses: {
        "Strongly Agree": 20,
        "Agree": 45,
        "Disagree": 25,
        "Strongly Disagree": 10
      }
    },
    {
      question: "I can access support when I need it",
      schoolResponses: {
        "Strongly Agree": 30,
        "Agree": 45,
        "Disagree": 15,
        "Strongly Disagree": 10
      },
      nationalResponses: {
        "Strongly Agree": 25,
        "Agree": 45,
        "Disagree": 20,
        "Strongly Disagree": 10
      }
    },
    {
      question: "I feel confident in my role",
      schoolResponses: {
        "Strongly Agree": 35,
        "Agree": 45,
        "Disagree": 15,
        "Strongly Disagree": 5
      },
      nationalResponses: {
        "Strongly Agree": 30,
        "Agree": 50,
        "Disagree": 15,
        "Strongly Disagree": 5
      }
    },
    {
      question: "I am proud to work for this organisation",
      schoolResponses: {
        "Strongly Agree": 40,
        "Agree": 45,
        "Disagree": 10,
        "Strongly Disagree": 5
      },
      nationalResponses: {
        "Strongly Agree": 35,
        "Agree": 45,
        "Disagree": 15,
        "Strongly Disagree": 5
      }
    }
  ];
  
  // Modify responses based on survey ID to show progress over time
  if (surveyId === "survey-2023-autumn") {
    // Autumn 2023 - slightly below average in some areas
    return baseResponses.map(q => {
      if (q.question === "Leadership prioritises staff wellbeing" || 
          q.question === "My workload is manageable" ||
          q.question === "I am in good physical and mental health") {
        return {
          ...q,
          schoolResponses: {
            "Strongly Agree": q.schoolResponses["Strongly Agree"] - 5,
            "Agree": q.schoolResponses["Agree"] - 5,
            "Disagree": q.schoolResponses["Disagree"] + 5,
            "Strongly Disagree": q.schoolResponses["Strongly Disagree"] + 5
          }
        };
      }
      return q;
    });
  } else if (surveyId === "survey-2024-spring") {
    // Spring 2024 - improving in some areas
    return baseResponses;
  } else if (surveyId === "survey-2024-summer") {
    // Summer 2024 - significant improvement in key areas
    return baseResponses.map(q => {
      if (q.question === "Leadership prioritises staff wellbeing" || 
          q.question === "My workload is manageable" ||
          q.question === "I have a good work-life balance" ||
          q.question === "I am in good physical and mental health") {
        return {
          ...q,
          schoolResponses: {
            "Strongly Agree": q.schoolResponses["Strongly Agree"] + 10,
            "Agree": q.schoolResponses["Agree"] + 5,
            "Disagree": q.schoolResponses["Disagree"] - 10,
            "Strongly Disagree": q.schoolResponses["Strongly Disagree"] - 5
          }
        };
      }
      return q;
    });
  }
  
  return baseResponses;
};

// Mock text responses
export const getMockTextResponses = (surveyId?: string) => {
  // Common positive responses
  const commonPositive = [
    { response: "Supportive environment for professional development", created_at: "2024-03-15" },
    { response: "Good communication between leadership and staff", created_at: "2024-03-17" },
    { response: "Strong sense of community and teamwork", created_at: "2024-03-20" },
  ];
  
  // Common improvement areas
  const commonImprovements = [
    { response: "More consistent approach to workload management across departments", created_at: "2024-03-16" },
    { response: "Additional planning time for new curriculum initiatives", created_at: "2024-03-18" },
    { response: "More opportunities for cross-departmental collaboration", created_at: "2024-03-19" },
  ];
  
  if (surveyId === "survey-2023-autumn") {
    return {
      doingWell: [
        ...commonPositive,
        { response: "Good induction process for new staff", created_at: "2023-10-18" },
      ],
      improvements: [
        ...commonImprovements,
        { response: "More consideration of work-life balance when planning events", created_at: "2023-10-17" },
        { response: "Clearer communication about upcoming changes", created_at: "2023-10-20" },
      ]
    };
  } else if (surveyId === "survey-2024-spring") {
    return {
      doingWell: [
        ...commonPositive,
        { response: "Improved communication about strategic decisions", created_at: "2024-02-14" },
        { response: "Better recognition of staff achievements", created_at: "2024-02-18" },
      ],
      improvements: [
        ...commonImprovements,
        { response: "Still need more consistent approach to marking policies", created_at: "2024-02-15" },
      ]
    };
  } else if (surveyId === "survey-2024-summer") {
    return {
      doingWell: [
        ...commonPositive,
        { response: "Significant improvement in workload management", created_at: "2024-06-10" },
        { response: "Leadership really listening to staff concerns", created_at: "2024-06-12" },
        { response: "Great support for mental health and wellbeing", created_at: "2024-06-15" },
      ],
      improvements: [
        { response: "Further investment in staff facilities would be welcome", created_at: "2024-06-11" },
        { response: "More regular celebration of achievements", created_at: "2024-06-14" },
      ]
    };
  }
  
  return {
    doingWell: commonPositive,
    improvements: commonImprovements
  };
};
