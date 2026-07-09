export interface ExperienceEntry {
  role: string;
  org: string;
  location: string;
  dates: string;
  link?: string;
  bullets: string[];
  tags: string[];
}

// Reverse chronological — do not reorder, do not edit copy or numbers.
export const experience: ExperienceEntry[] = [
  {
    role: "Project Research Scientist",
    org: "Amity Centre for AI",
    location: "Noida, UP",
    dates: "Jun 2026–Present",
    bullets: [
      "Contributing to an ICMR-NIRBI funded tuberculosis research project focused on AI-driven pharmacokinetics.",
      "Developing predictive models for limited sampling strategy and therapeutic drug monitoring.",
    ],
    tags: ["ICMR-NIRBI", "pharmacokinetics"],
  },
  {
    role: "Project Engineer",
    org: "Amity Centre for AI",
    location: "Noida, UP",
    dates: "Oct 2025–Mar 2026",
    link: "https://virusprednie.netlify.app",
    bullets: [
      "Developing multi-label classifier on ICMR-NIE dataset (5.4M+ patient records) for 26 viral infection predictions.",
      "Developed a Custom Gated Residual Transformer achieving 0.71 F1-score, beating XGBoost by 2%.",
      "Built reproducible training + evaluation pipelines using PyTorch for large-scale structured healthcare data.",
    ],
    tags: ["5.4M+ records", "0.71 F1", "+2% vs XGBoost"],
  },
  {
    role: "Intern AI/ML",
    org: "National Institute of Electronics & IT",
    location: "Kokrajhar, Assam",
    dates: "Aug 2025–Oct 2025",
    link: "https://respiratoryscreener.netlify.app",
    bullets: [
      "Developed CNN-based respiratory classifier using focal loss and SpecAugment on 5K+ cough audio samples.",
      "Deployed FastAPI backend (<1s inference) and React frontend with live recording on HuggingFace/Netlify.",
      "Optimized model (1.27M params) for <1s CPU inference using mixup augmentation and 5-fold CV.",
    ],
    tags: ["<1s CPU inference", "1.27M params", "5K+ samples"],
  },
  {
    role: "Intern",
    org: "NEEPCO",
    location: "Shillong, Meghalaya",
    dates: "Jul 2024–Aug 2024",
    link: "https://neepcodop.netlify.app",
    bullets: [
      "Deployed RAG policy chatbot using quantized TinyLlama for clause-level semantic retrieval optimized for CPU.",
      "Fine-tuned model with llama-cpp-python optimization to run reliably on resource-constrained infrastructure.",
      "Implemented bge-large-en-v1.5 embeddings and ChromaDB vector search for policy document matching.",
    ],
    tags: ["quantized TinyLlama", "CPU-only RAG"],
  },
];
