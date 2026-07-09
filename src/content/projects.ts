export interface ProjectEntry {
  title: string;
  link: string;
  bullets: string[];
  tags: string[];
}

export const projects: ProjectEntry[] = [
  {
    title: "Gallbladder Carcinoma Cancer Detection",
    link: "https://gbca.netlify.app",
    bullets: [
      "Built a dual-path CBAM+MSAM CNN for CT-based GBC detection in collaboration with AIIMS New Delhi.",
      "Trained and validated on a 1,184-image clinical dataset with 86% accuracy and 0.893 AUC-ROC.",
      "Confirmed clinical interpretability through Grad-CAM++ visualizations localized to gallbladder regions.",
    ],
    tags: ["86% accuracy", "0.893 AUC-ROC", "1,184 CT images"],
  },
  {
    title: "Agentic BI Dashboard (Monday.com)",
    link: "https://bi-agent.streamlit.app",
    bullets: [
      "Natural-language BI agent over Monday.com GraphQL API querying 344 live deals and 176 work orders.",
      "Dual-model LLM setup LLaMA3.3 70B/8B cutting token input from 69K to 1,500 via pre-aggregated responses.",
      "Handled data quality: positional column remapping, heterogeneous quantity parsing, null value flagging.",
    ],
    tags: ["69K → 1.5K tokens", "344 live deals", "LLaMA3.3 70B/8B"],
  },
];
