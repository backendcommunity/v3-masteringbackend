"use client"

import type React from "react"

interface Project30PageProps {
  courseId?: string
  onNavigate?: (path: string) => void
}

const Project30Page: React.FC<Project30PageProps> = ({ courseId, onNavigate }) => {
  return (
    <div className="container">
      <h1 className="title">Project 30 - Daily UI Challenge</h1>

      <div className="mobile-content">
        <p className="description">This project is a personal challenge to complete 30 daily UI design prompts.</p>

        <div className="mobile-grid">
          <div className="grid">
            <div
              className="card card-hover cursor-pointer"
              onClick={() => onNavigate?.(`/dashboard/project30/${courseId}/day/1`)}
            >
              <h3>Day 1: Sign Up</h3>
              <p>Design a sign up page, form, or app screen.</p>
            </div>

            <div
              className="card card-hover cursor-pointer"
              onClick={() => onNavigate?.(`/dashboard/project30/${courseId}/day/2`)}
            >
              <h3>Day 2: Credit Card Checkout</h3>
              <p>Design a credit card checkout form or page. Don't forget the important security features.</p>
            </div>

            <div
              className="card card-hover cursor-pointer"
              onClick={() => onNavigate?.(`/dashboard/project30/${courseId}/day/3`)}
            >
              <h3>Day 3: Landing Page</h3>
              <p>Design a landing page.</p>
            </div>

            <div
              className="card card-hover cursor-pointer"
              onClick={() => onNavigate?.(`/dashboard/project30/${courseId}/day/4`)}
            >
              <h3>Day 4: Calculator</h3>
              <p>Design a calculator app.</p>
            </div>

            <div
              className="card card-hover cursor-pointer"
              onClick={() => onNavigate?.(`/dashboard/project30/${courseId}/day/5`)}
            >
              <h3>Day 5: App Icon</h3>
              <p>Design an app icon.</p>
            </div>

            <div
              className="card card-hover cursor-pointer"
              onClick={() => onNavigate?.(`/dashboard/project30/${courseId}/day/6`)}
            >
              <h3>Day 6: User Profile</h3>
              <p>Design a user profile page.</p>
            </div>

            <div
              className="card card-hover cursor-pointer"
              onClick={() => onNavigate?.(`/dashboard/project30/${courseId}/day/7`)}
            >
              <h3>Day 7: Settings</h3>
              <p>Design app settings screen.</p>
            </div>

            <div
              className="card card-hover cursor-pointer"
              onClick={() => onNavigate?.(`/dashboard/project30/${courseId}/day/8`)}
            >
              <h3>Day 8: 404 Page</h3>
              <p>Design a 404 page.</p>
            </div>

            <div
              className="card card-hover cursor-pointer"
              onClick={() => onNavigate?.(`/dashboard/project30/${courseId}/day/9`)}
            >
              <h3>Day 9: Music Player</h3>
              <p>Design a music player.</p>
            </div>

            <div
              className="card card-hover cursor-pointer"
              onClick={() => onNavigate?.(`/dashboard/project30/${courseId}/day/10`)}
            >
              <h3>Day 10: Social Share</h3>
              <p>Design a social share button/icon.</p>
            </div>

            <div
              className="card card-hover cursor-pointer"
              onClick={() => onNavigate?.(`/dashboard/project30/${courseId}/day/11`)}
            >
              <h3>Day 11: Flash Message</h3>
              <p>Design a flash message.</p>
            </div>

            <div
              className="card card-hover cursor-pointer"
              onClick={() => onNavigate?.(`/dashboard/project30/${courseId}/day/12`)}
            >
              <h3>Day 12: E-Commerce Single View</h3>
              <p>Design a single view of a product from an e-commerce site.</p>
            </div>

            <div
              className="card card-hover cursor-pointer"
              onClick={() => onNavigate?.(`/dashboard/project30/${courseId}/day/13`)}
            >
              <h3>Day 13: Direct Messaging</h3>
              <p>Design a direct messaging interface.</p>
            </div>

            <div
              className="card card-hover cursor-pointer"
              onClick={() => onNavigate?.(`/dashboard/project30/${courseId}/day/14`)}
            >
              <h3>Day 14: On/Off Switch</h3>
              <p>Design an on/off switch.</p>
            </div>

            <div
              className="card card-hover cursor-pointer"
              onClick={() => onNavigate?.(`/dashboard/project30/${courseId}/day/15`)}
            >
              <h3>Day 15: Controls</h3>
              <p>Design a set of controls.</p>
            </div>

            <div
              className="card card-hover cursor-pointer"
              onClick={() => onNavigate?.(`/dashboard/project30/${courseId}/day/16`)}
            >
              <h3>Day 16: Split Test</h3>
              <p>Design a split test.</p>
            </div>

            <div
              className="card card-hover cursor-pointer"
              onClick={() => onNavigate?.(`/dashboard/project30/${courseId}/day/17`)}
            >
              <h3>Day 17: Email Receipt</h3>
              <p>Design an email receipt.</p>
            </div>

            <div
              className="card card-hover cursor-pointer"
              onClick={() => onNavigate?.(`/dashboard/project30/${courseId}/day/18`)}
            >
              <h3>Day 18: Analytics Chart</h3>
              <p>Design an analytics chart.</p>
            </div>

            <div
              className="card card-hover cursor-pointer"
              onClick={() => onNavigate?.(`/dashboard/project30/${courseId}/day/19`)}
            >
              <h3>Day 19: Leaderboard</h3>
              <p>Design a leaderboard.</p>
            </div>

            <div
              className="card card-hover cursor-pointer"
              onClick={() => onNavigate?.(`/dashboard/project30/${courseId}/day/20`)}
            >
              <h3>Day 20: Location Tracker</h3>
              <p>Design a location tracker.</p>
            </div>

            <div
              className="card card-hover cursor-pointer"
              onClick={() => onNavigate?.(`/dashboard/project30/${courseId}/day/21`)}
            >
              <h3>Day 21: Home Monitoring Dashboard</h3>
              <p>Design a home monitoring dashboard.</p>
            </div>

            <div
              className="card card-hover cursor-pointer"
              onClick={() => onNavigate?.(`/dashboard/project30/${courseId}/day/22`)}
            >
              <h3>Day 22: Loading Screen</h3>
              <p>Design a loading screen.</p>
            </div>

            <div
              className="card card-hover cursor-pointer"
              onClick={() => onNavigate?.(`/dashboard/project30/${courseId}/day/23`)}
            >
              <h3>Day 23: Onboarding</h3>
              <p>Design an onboarding experience.</p>
            </div>

            <div
              className="card card-hover cursor-pointer"
              onClick={() => onNavigate?.(`/dashboard/project30/${courseId}/day/24`)}
            >
              <h3>Day 24: Boarding Pass</h3>
              <p>Design a boarding pass.</p>
            </div>

            <div
              className="card card-hover cursor-pointer"
              onClick={() => onNavigate?.(`/dashboard/project30/${courseId}/day/25`)}
            >
              <h3>Day 25: News Feed</h3>
              <p>Design a news feed.</p>
            </div>

            <div
              className="card card-hover cursor-pointer"
              onClick={() => onNavigate?.(`/dashboard/project30/${courseId}/day/26`)}
            >
              <h3>Day 26: Subscribe</h3>
              <p>Design a subscribe page.</p>
            </div>

            <div
              className="card card-hover cursor-pointer"
              onClick={() => onNavigate?.(`/dashboard/project30/${courseId}/day/27`)}
            >
              <h3>Day 27: Dropdown</h3>
              <p>Design a dropdown.</p>
            </div>

            <div
              className="card card-hover cursor-pointer"
              onClick={() => onNavigate?.(`/dashboard/project30/${courseId}/day/28`)}
            >
              <h3>Day 28: Contact Form</h3>
              <p>Design a contact form.</p>
            </div>

            <div
              className="card card-hover cursor-pointer"
              onClick={() => onNavigate?.(`/dashboard/project30/${courseId}/day/29`)}
            >
              <h3>Day 29: Map</h3>
              <p>Design a map.</p>
            </div>

            <div
              className="card card-hover cursor-pointer"
              onClick={() => onNavigate?.(`/dashboard/project30/${courseId}/day/30`)}
            >
              <h3>Day 30: Pricing</h3>
              <p>Design a pricing page.</p>
            </div>
          </div>
        </div>

        <div className="mobile-button-group">
          <button className="button" onClick={() => onNavigate?.("/dashboard")}>
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

// Export both named and default
export { Project30Page }
export default Project30Page
