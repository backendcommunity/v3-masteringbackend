"use client"

import { useState } from "react"
import ProjectCard from "../components/ProjectCard"

const Projects = () => {
  const [filter, setFilter] = useState("all")

  const projects = [
    {
      id: 1,
      title: "Project 1",
      description: "Description of project 1.",
      category: "web",
      imageUrl: "https://via.placeholder.com/400x200",
    },
    {
      id: 2,
      title: "Project 2",
      description: "Description of project 2.",
      category: "mobile",
      imageUrl: "https://via.placeholder.com/400x200",
    },
    {
      id: 3,
      title: "Project 3",
      description: "Description of project 3.",
      category: "design",
      imageUrl: "https://via.placeholder.com/400x200",
    },
    {
      id: 4,
      title: "Project 4",
      description: "Description of project 4.",
      category: "web",
      imageUrl: "https://via.placeholder.com/400x200",
    },
    {
      id: 5,
      title: "Project 5",
      description: "Description of project 5.",
      category: "mobile",
      imageUrl: "https://via.placeholder.com/400x200",
    },
  ]

  const filteredProjects = filter === "all" ? projects : projects.filter((project) => project.category === filter)

  return (
    <div className="container mobile-content">
      <h1>Projects</h1>

      <div className="mobile-form">
        <label htmlFor="filter">Filter by:</label>
        <select id="filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="web">Web</option>
          <option value="mobile">Mobile</option>
          <option value="design">Design</option>
        </select>
      </div>

      <div className="mobile-grid">
        {filteredProjects.map((project) => (
          <ProjectCard key={project.id} project={project} className="card-hover mobile-padding" />
        ))}
      </div>
    </div>
  )
}

export default Projects
