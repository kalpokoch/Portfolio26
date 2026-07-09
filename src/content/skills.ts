export const skills = {
  Languages: ["Python", "C++", "C", "SQL"],
  "ML/DL": ["PyTorch", "TensorFlow", "scikit-learn", "LangChain", "NumPy", "Pandas", "OpenCV"],
  Tools: ["FastAPI", "ChromaDB", "MongoDB", "llama-cpp-python", "Git", "Docker"],
} as const;

export const education = {
  institution: "Central Institute of Technology",
  degree: "BTech Computer Science",
  dates: "Aug 2021–May 2025",
  coursework: [
    "Machine Learning",
    "Deep Learning",
    "NLP",
    "DSA",
    "Computational Theory",
    "Database",
  ],
} as const;

export const certifications = [
  {
    name: "Fundamentals of Deep Learning",
    issuer: "NVIDIA",
    date: "Dec 2025",
  },
] as const;
