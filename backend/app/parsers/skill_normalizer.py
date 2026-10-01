import re
from typing import Dict, List, Any, Tuple, Optional

# Canonical skills registry with comprehensive alias mappings
# Maps lowercase aliases to (Canonical Name, Confidence, Category)
SKILL_ALIASES: Dict[str, Tuple[str, float, str]] = {
    # Languages
    "python": ("Python", 1.0, "Programming Language"),
    "python3": ("Python", 0.99, "Programming Language"),
    "python 3": ("Python", 0.99, "Programming Language"),
    "python programming": ("Python", 0.98, "Programming Language"),
    "python developer": ("Python", 0.95, "Programming Language"),
    "javascript": ("JavaScript", 1.0, "Programming Language"),
    "js": ("JavaScript", 0.95, "Programming Language"),
    "ecmascript": ("JavaScript", 0.95, "Programming Language"),
    "es6": ("JavaScript", 0.95, "Programming Language"),
    "typescript": ("TypeScript", 1.0, "Programming Language"),
    "ts": ("TypeScript", 0.95, "Programming Language"),
    "java": ("Java", 1.0, "Programming Language"),
    "core java": ("Java", 0.98, "Programming Language"),
    "c++": ("C++", 1.0, "Programming Language"),
    "cpp": ("C++", 0.98, "Programming Language"),
    "c#": ("C#", 1.0, "Programming Language"),
    "csharp": ("C#", 0.98, "Programming Language"),
    "golang": ("Go", 0.99, "Programming Language"),
    "go lang": ("Go", 0.99, "Programming Language"),
    "rust": ("Rust", 1.0, "Programming Language"),
    "ruby": ("Ruby", 1.0, "Programming Language"),
    "php": ("PHP", 1.0, "Programming Language"),
    "swift": ("Swift", 1.0, "Programming Language"),
    "kotlin": ("Kotlin", 1.0, "Programming Language"),
    "scala": ("Scala", 1.0, "Programming Language"),
    "sql": ("SQL", 1.0, "Database"),
    "html": ("HTML5", 0.95, "Frontend"),
    "html5": ("HTML5", 1.0, "Frontend"),
    "css": ("CSS3", 0.95, "Frontend"),
    "css3": ("CSS3", 1.0, "Frontend"),

    # Frameworks & Libraries
    "react": ("React", 1.0, "Frontend Framework"),
    "reactjs": ("React", 0.99, "Frontend Framework"),
    "react.js": ("React", 0.99, "Frontend Framework"),
    "next.js": ("Next.js", 1.0, "Frontend Framework"),
    "nextjs": ("Next.js", 0.99, "Frontend Framework"),
    "next js": ("Next.js", 0.99, "Frontend Framework"),
    "vue": ("Vue.js", 0.98, "Frontend Framework"),
    "vuejs": ("Vue.js", 0.99, "Frontend Framework"),
    "vue.js": ("Vue.js", 1.0, "Frontend Framework"),
    "angular": ("Angular", 1.0, "Frontend Framework"),
    "angularjs": ("Angular", 0.95, "Frontend Framework"),
    "node": ("Node.js", 0.95, "Backend Framework"),
    "nodejs": ("Node.js", 0.99, "Backend Framework"),
    "node.js": ("Node.js", 1.0, "Backend Framework"),
    "express": ("Express", 0.98, "Backend Framework"),
    "expressjs": ("Express", 0.99, "Backend Framework"),
    "express.js": ("Express", 1.0, "Backend Framework"),
    "fastapi": ("FastAPI", 1.0, "Backend Framework"),
    "fast api": ("FastAPI", 0.98, "Backend Framework"),
    "django": ("Django", 1.0, "Backend Framework"),
    "flask": ("Flask", 1.0, "Backend Framework"),
    "spring": ("Spring Boot", 0.95, "Backend Framework"),
    "spring boot": ("Spring Boot", 1.0, "Backend Framework"),
    "springboot": ("Spring Boot", 0.99, "Backend Framework"),
    ".net": (".NET", 1.0, "Backend Framework"),
    "dotnet": (".NET", 0.98, "Backend Framework"),
    ".net core": (".NET Core", 0.99, "Backend Framework"),
    "tailwind": ("Tailwind CSS", 0.98, "Frontend"),
    "tailwindcss": ("Tailwind CSS", 1.0, "Frontend"),
    "tailwind css": ("Tailwind CSS", 1.0, "Frontend"),
    "redux": ("Redux", 1.0, "Frontend"),
    "redux toolkit": ("Redux Toolkit", 1.0, "Frontend"),
    "graphql": ("GraphQL", 1.0, "API"),
    "rest api": ("REST API", 1.0, "API"),
    "restful api": ("REST API", 0.99, "API"),
    "rest": ("REST API", 0.95, "API"),
    "grpc": ("gRPC", 1.0, "API"),

    # Databases
    "postgres": ("PostgreSQL", 0.98, "Database"),
    "postgresql": ("PostgreSQL", 1.0, "Database"),
    "postgre": ("PostgreSQL", 0.96, "Database"),
    "mysql": ("MySQL", 1.0, "Database"),
    "mongo": ("MongoDB", 0.96, "Database"),
    "mongodb": ("MongoDB", 1.0, "Database"),
    "redis": ("Redis", 1.0, "Database"),
    "elasticsearch": ("Elasticsearch", 1.0, "Database"),
    "elastic search": ("Elasticsearch", 0.98, "Database"),
    "dynamodb": ("DynamoDB", 1.0, "Database"),
    "dynamo db": ("DynamoDB", 0.98, "Database"),
    "cassandra": ("Cassandra", 1.0, "Database"),
    "sqlite": ("SQLite", 1.0, "Database"),
    "oracle db": ("Oracle", 0.98, "Database"),
    "oracle database": ("Oracle", 0.98, "Database"),
    "sql server": ("Microsoft SQL Server", 0.98, "Database"),
    "mssql": ("Microsoft SQL Server", 0.98, "Database"),

    # Cloud & DevOps
    "aws": ("AWS", 1.0, "Cloud Platform"),
    "aws cloud": ("AWS", 0.99, "Cloud Platform"),
    "amazon web services": ("AWS", 0.99, "Cloud Platform"),
    "amazon aws": ("AWS", 0.99, "Cloud Platform"),
    "gcp": ("GCP", 1.0, "Cloud Platform"),
    "google cloud": ("GCP", 0.99, "Cloud Platform"),
    "google cloud platform": ("GCP", 1.0, "Cloud Platform"),
    "azure": ("Azure", 1.0, "Cloud Platform"),
    "ms azure": ("Azure", 0.99, "Cloud Platform"),
    "microsoft azure": ("Azure", 1.0, "Cloud Platform"),
    "docker": ("Docker", 1.0, "DevOps"),
    "docker container": ("Docker", 0.98, "DevOps"),
    "kubernetes": ("Kubernetes", 1.0, "DevOps"),
    "k8s": ("Kubernetes", 0.98, "DevOps"),
    "terraform": ("Terraform", 1.0, "DevOps"),
    "ansible": ("Ansible", 1.0, "DevOps"),
    "ci/cd": ("CI/CD", 1.0, "DevOps"),
    "cicd": ("CI/CD", 0.98, "DevOps"),
    "ci cd": ("CI/CD", 0.98, "DevOps"),
    "git": ("Git", 1.0, "DevOps"),
    "github": ("GitHub", 1.0, "DevOps"),
    "github actions": ("GitHub Actions", 1.0, "DevOps"),
    "linux": ("Linux", 1.0, "Operating System"),

    # AI / ML & Data
    "ml": ("Machine Learning", 0.95, "Data & AI"),
    "machine learning": ("Machine Learning", 1.0, "Data & AI"),
    "deep learning": ("Deep Learning", 1.0, "Data & AI"),
    "dl": ("Deep Learning", 0.92, "Data & AI"),
    "nlp": ("Natural Language Processing", 0.98, "Data & AI"),
    "natural language processing": ("Natural Language Processing", 1.0, "Data & AI"),
    "computer vision": ("Computer Vision", 1.0, "Data & AI"),
    "cv": ("Computer Vision", 0.85, "Data & AI"),
    "llm": ("LLMs", 0.95, "Data & AI"),
    "llms": ("LLMs", 1.0, "Data & AI"),
    "large language models": ("LLMs", 0.99, "Data & AI"),
    "pytorch": ("PyTorch", 1.0, "Data & AI"),
    "tensorflow": ("TensorFlow", 1.0, "Data & AI"),
    "tf": ("TensorFlow", 0.88, "Data & AI"),
    "scikit-learn": ("Scikit-Learn", 1.0, "Data & AI"),
    "scikit learn": ("Scikit-Learn", 0.99, "Data & AI"),
    "sklearn": ("Scikit-Learn", 0.98, "Data & AI"),
    "pandas": ("Pandas", 1.0, "Data & AI"),
    "numpy": ("NumPy", 1.0, "Data & AI"),
    "kafka": ("Kafka", 1.0, "Distributed Systems"),
    "apache kafka": ("Kafka", 0.99, "Distributed Systems"),
    "rabbitmq": ("RabbitMQ", 1.0, "Distributed Systems"),
    "rabbit mq": ("RabbitMQ", 0.98, "Distributed Systems"),
    "microservices": ("Microservices", 1.0, "Architecture"),
    "distributed systems": ("Distributed Systems", 1.0, "Architecture"),
}

# Strict guard against false merges (Do NOT merge these!)
DISTINCT_UNTOUCHABLE_PAIRS = [
    ("Java", "JavaScript"),
    ("C", "C++"),
    ("C", "C#"),
    ("C++", "C#"),
    ("TypeScript", "JavaScript"),
    ("Go", "Google"),
    ("Python", "PyTorch"),
]

class SkillNormalizer:
    @staticmethod
    def normalize_skill(raw_skill: str) -> Dict[str, Any]:
        """
        Normalize an individual skill string into its canonical entity.
        Returns {
            'original_skill': str,
            'normalized_skill': str,
            'confidence': float,
            'category': str
        }
        """
        clean_raw = raw_skill.strip()
        lower_raw = clean_raw.lower()

        # Direct match in alias map
        if lower_raw in SKILL_ALIASES:
            canonical, conf, category = SKILL_ALIASES[lower_raw]
            return {
                "original_skill": clean_raw,
                "normalized_skill": canonical,
                "confidence": conf,
                "category": category
            }

        # Strip prefixes/suffixes like "programming", "technology", "proficient in", "experience with"
        cleaned_str = re.sub(r"^(?:proficient in|experience with|knowledge of|hands-on|strong in)\s+", "", lower_raw)
        cleaned_str = re.sub(r"\s+(?:programming|development|framework|cloud|library|tools?|stack)$", "", cleaned_str).strip()

        if cleaned_str in SKILL_ALIASES:
            canonical, conf, category = SKILL_ALIASES[cleaned_str]
            return {
                "original_skill": clean_raw,
                "normalized_skill": canonical,
                "confidence": round(conf * 0.95, 2),
                "category": category
            }

        # Version stripping (e.g. "React 18", "Python 3.10", "Postgres 14")
        version_stripped = re.sub(r"\s+v?\d+(?:\.\d+)*$", "", cleaned_str).strip()
        if version_stripped in SKILL_ALIASES:
            canonical, conf, category = SKILL_ALIASES[version_stripped]
            return {
                "original_skill": clean_raw,
                "normalized_skill": canonical,
                "confidence": round(conf * 0.92, 2),
                "category": category
            }

        # If no normalization found, retain clean original representation
        return {
            "original_skill": clean_raw,
            "normalized_skill": clean_raw.title() if len(clean_raw) > 3 else clean_raw.upper(),
            "confidence": 0.80,
            "category": "General"
        }

    @staticmethod
    def normalize_skills_list(skills: List[str], deduplicate: bool = False) -> List[Dict[str, Any]]:
        """
        Normalize a list of skills. If deduplicate is True, returns unique canonical skills.
        Otherwise preserves 1-to-1 input mapping.
        """
        seen_canonical = set()
        normalized_results = []

        for s in skills:
            if not s or not s.strip():
                continue
            norm = SkillNormalizer.normalize_skill(s)
            canon = norm["normalized_skill"]
            if deduplicate:
                if canon not in seen_canonical:
                    seen_canonical.add(canon)
                    normalized_results.append(norm)
            else:
                normalized_results.append(norm)

        return normalized_results
