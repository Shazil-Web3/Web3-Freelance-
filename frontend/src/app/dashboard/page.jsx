"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { 
  Briefcase, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  Users,
  Star,
  Calendar,
  ChevronRight
} from "lucide-react";

const Dashboard = () => {
  const [userType, setUserType] = useState('freelancer');

  const freelancerData = {
    appliedJobs: [
      { id: 1, title: "DeFi Protocol Frontend", client: "CryptoCorp", budget: "$5,000", status: "pending", appliedDate: "2 days ago" },
      { id: 2, title: "Smart Contract Audit", client: "BlockStart", budget: "$3,500", status: "shortlisted", appliedDate: "5 days ago" },
      { id: 3, title: "NFT Marketplace Design", client: "ArtChain", budget: "$4,200", status: "rejected", appliedDate: "1 week ago" }
    ],
    ongoingProjects: [
      { id: 1, title: "DEX Integration", client: "SwapFlow", budget: "$8,000", progress: 75, deadline: "Dec 15, 2024", status: "milestone-2" },
      { id: 2, title: "Wallet Interface", client: "CryptoWallet", budget: "$6,500", progress: 40, deadline: "Jan 20, 2025", status: "milestone-1" }
    ],
    completedProjects: [
      { id: 1, title: "DAO Dashboard", client: "GovChain", payment: "$7,200", completedDate: "Nov 10, 2024", rating: 5 },
      { id: 2, title: "Token Launch Website", client: "NewCoin", payment: "$4,800", completedDate: "Oct 25, 2024", rating: 5 },
      { id: 3, title: "DApp Optimization", client: "FastChain", payment: "$3,200", completedDate: "Sep 15, 2024", rating: 4 }
    ]
  };

  const clientData = {
    hiredFreelancers: [
      { id: 1, name: "Alex Chen", project: "DeFi Protocol Frontend", amount: "$5,000", status: "working", startDate: "Nov 20, 2024" },
      { id: 2, name: "Sarah Kim", project: "Smart Contract Development", amount: "$12,000", status: "completed", startDate: "Oct 10, 2024" },
      { id: 3, name: "Mike Rodriguez", project: "UI/UX Design", amount: "$3,500", status: "milestone", startDate: "Nov 25, 2024" }
    ],
    ongoingProjects: [
      { id: 1, title: "DeFi Protocol Frontend", freelancer: "Alex Chen", budget: "$5,000", progress: 60, deadline: "Dec 30, 2024" },
      { id: 2, title: "Mobile App Development", freelancer: "Emma Wilson", budget: "$15,000", progress: 25, deadline: "Feb 15, 2025" }
    ],
    completedProjects: [
      { id: 1, title: "Smart Contract Development", freelancer: "Sarah Kim", spent: "$12,000", completedDate: "Nov 15, 2024", rating: 5 },
      { id: 2, title: "Token Economics Model", freelancer: "David Park", spent: "$8,500", completedDate: "Oct 30, 2024", rating: 5 }
    ],
    totalSpent: "$41,000"
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        {/* Dashboard Header */}
        <section className="py-12 px-12 lg:px-28 relative overflow-hidden w-full">
          <div className="absolute inset-0 bg-gradient-to-br from-success/18 via-background to-accent/18" />
          <div className="absolute top-1/2 left-[-10rem] w-[36rem] h-[36rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.22)_0%,_transparent_70%)] -translate-y-1/2" />
          <div className="absolute top-1/2 right-[-10rem] w-[36rem] h-[36rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.18)_0%,_transparent_70%)] -translate-y-1/2" />
          
          <div className="container mx-auto relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2">
                  Welcome back, <span className="text-gradient-green">John</span>
                </h1>
                <p className="text-xl text-muted-foreground">Here's your Web3 freelance overview</p>
              </div>
              
              <div className="card-floating p-1">
                <div className="flex bg-secondary/50 rounded-lg">
                  <button
                    onClick={() => setUserType('freelancer')}
                    className={`px-6 py-3 rounded-lg font-medium transition-all ${
                      userType === 'freelancer' 
                        ? 'bg-success text-success-foreground shadow-md' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Freelancer View
                  </button>
                  <button
                    onClick={() => setUserType('client')}
                    className={`px-6 py-3 rounded-lg font-medium transition-all ${
                      userType === 'client' 
                        ? 'bg-accent text-accent-foreground shadow-md' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Client View
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {userType === 'freelancer' ? (
          <>
            {/* Freelancer Stats */}
            <section className="py-8 px-12 lg:px-28 relative overflow-hidden w-full">
              {/* Gradient orbs for Freelancer Stats */}
              <div className="absolute top-1/2 left-[-8rem] w-[20rem] h-[20rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.16)_0%,_transparent_70%)] -translate-y-1/2" />
              <div className="absolute top-1/2 right-[-8rem] w-[16rem] h-[16rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.14)_0%,_transparent_70%)] -translate-y-1/2" />
              
              <div className="container mx-auto">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                  <div className="card-floating p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Briefcase className="w-8 h-8 text-success" />
                      <span className="text-sm text-muted-foreground">This Month</span>
                    </div>
                    <div className="text-2xl font-bold text-gradient-green">8</div>
                    <div className="text-sm text-muted-foreground">Jobs Applied</div>
                  </div>
                  
                  <div className="card-floating p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Clock className="w-8 h-8 text-accent" />
                      <span className="text-sm text-muted-foreground">Active</span>
                    </div>
                    <div className="text-2xl font-bold text-gradient-orange">2</div>
                    <div className="text-sm text-muted-foreground">Ongoing Projects</div>
                  </div>
                  
                  <div className="card-floating p-6">
                    <div className="flex items-center justify-between mb-4">
                      <DollarSign className="w-8 h-8 text-success" />
                      <span className="text-sm text-muted-foreground">Total</span>
                    </div>
                    <div className="text-2xl font-bold text-gradient-green">$15.2K</div>
                    <div className="text-sm text-muted-foreground">Earned</div>
                  </div>
                  
                  <div className="card-floating p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Star className="w-8 h-8 text-accent" />
                      <span className="text-sm text-muted-foreground">Average</span>
                    </div>
                    <div className="text-2xl font-bold text-gradient-orange">4.9</div>
                    <div className="text-sm text-muted-foreground">Rating</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Applied Jobs */}
            <section className="py-8">
              <div className="container mx-auto px-8 lg:px-12">
                <h2 className="text-2xl font-bold mb-6">Recent Applications</h2>
                <div className="space-y-4">
                  {freelancerData.appliedJobs.map((job) => (
                    <div key={job.id} className="card-floating p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">{job.title}</h3>
                          <p className="text-muted-foreground mb-2">Client: {job.client}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Budget: {job.budget}</span>
                            <span>Applied: {job.appliedDate}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            job.status === 'pending' ? 'bg-accent/10 text-accent' :
                            job.status === 'shortlisted' ? 'bg-success/10 text-success' :
                            'bg-destructive/10 text-destructive'
                          }`}>
                            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                          </span>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Ongoing Projects */}
            <section className="py-8 relative overflow-hidden w-full max-w-full">
              {/* Gradient orbs for Ongoing Projects */}
              <div className="absolute top-1/2 left-1/4 w-[18rem] h-[18rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.18)_0%,_transparent_70%)] -translate-y-1/2" />
              <div className="absolute top-1/2 right-1/4 w-[16rem] h-[16rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.16)_0%,_transparent_70%)] -translate-y-1/2" />
              
              <div className="container mx-auto px-8 lg:px-12">
                <h2 className="text-2xl font-bold mb-6">Ongoing Projects</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {freelancerData.ongoingProjects.map((project) => (
                    <div key={project.id} className="card-floating p-6">
                      <h3 className="text-lg font-semibold mb-2">{project.title}</h3>
                      <p className="text-muted-foreground mb-4">Client: {project.client}</p>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{project.progress}%</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-success h-2 rounded-full transition-all"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            Due: {project.deadline}
                          </span>
                          <span className="font-semibold text-gradient-green">{project.budget}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Completed Projects */}
            <section className="py-8 relative overflow-hidden w-full max-w-full">
              {/* Gradient orbs for Completed Projects */}
              <div className="absolute top-1/2 left-[-6rem] w-[14rem] h-[14rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.14)_0%,_transparent_70%)] -translate-y-1/2" />
              <div className="absolute top-1/2 right-1/4 w-[18rem] h-[18rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.18)_0%,_transparent_70%)] -translate-y-1/2" />
              
              <div className="container mx-auto px-8 lg:px-12">
                <h2 className="text-2xl font-bold mb-6">Completed Projects</h2>
                <div className="space-y-4">
                  {freelancerData.completedProjects.map((project) => (
                    <div key={project.id} className="card-floating p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">{project.title}</h3>
                          <p className="text-muted-foreground mb-2">Client: {project.client}</p>
                          <p className="text-sm text-muted-foreground">Completed: {project.completedDate}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-gradient-green mb-2">{project.payment}</div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-4 h-4 ${i < project.rating ? 'text-accent fill-current' : 'text-muted-foreground'}`} 
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        ) : (
          <>
            {/* Client Stats */}
            <section className="py-8 relative overflow-hidden w-full max-w-full">
              {/* Gradient orbs for Client Stats */}
              <div className="absolute top-1/2 left-[-8rem] w-[20rem] h-[20rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.16)_0%,_transparent_70%)] -translate-y-1/2" />
              <div className="absolute top-1/2 right-[-8rem] w-[16rem] h-[16rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.14)_0%,_transparent_70%)] -translate-y-1/2" />
              
              <div className="container mx-auto px-8 lg:px-12">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                  <div className="card-floating p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Users className="w-8 h-8 text-success" />
                      <span className="text-sm text-muted-foreground">Total</span>
                    </div>
                    <div className="text-2xl font-bold text-gradient-green">12</div>
                    <div className="text-sm text-muted-foreground">Hired Freelancers</div>
                  </div>
                  
                  <div className="card-floating p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Briefcase className="w-8 h-8 text-accent" />
                      <span className="text-sm text-muted-foreground">Active</span>
                    </div>
                    <div className="text-2xl font-bold text-gradient-orange">3</div>
                    <div className="text-sm text-muted-foreground">Projects Running</div>
                  </div>
                  
                  <div className="card-floating p-6">
                    <div className="flex items-center justify-between mb-4">
                      <DollarSign className="w-8 h-8 text-success" />
                      <span className="text-sm text-muted-foreground">Total</span>
                    </div>
                    <div className="text-2xl font-bold text-gradient-green">{clientData.totalSpent}</div>
                    <div className="text-sm text-muted-foreground">Invested</div>
                  </div>
                  
                  <div className="card-floating p-6">
                    <div className="flex items-center justify-between mb-4">
                      <TrendingUp className="w-8 h-8 text-accent" />
                      <span className="text-sm text-muted-foreground">Success</span>
                    </div>
                    <div className="text-2xl font-bold text-gradient-orange">94%</div>
                    <div className="text-sm text-muted-foreground">Project Rate</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Hired Freelancers */}
            <section className="py-8">
              <div className="container mx-auto px-8 lg:px-12">
                <h2 className="text-2xl font-bold mb-6">Recent Hires</h2>
                <div className="space-y-4">
                  {clientData.hiredFreelancers.map((hire) => (
                    <div key={hire.id} className="card-floating p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">{hire.name}</h3>
                          <p className="text-muted-foreground mb-2">Project: {hire.project}</p>
                          <p className="text-sm text-muted-foreground">Started: {hire.startDate}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-lg font-bold text-gradient-green mb-1">{hire.amount}</div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              hire.status === 'working' ? 'bg-accent/10 text-accent' :
                              hire.status === 'completed' ? 'bg-success/10 text-success' :
                              'bg-primary/10 text-primary'
                            }`}>
                              {hire.status.charAt(0).toUpperCase() + hire.status.slice(1)}
                            </span>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Client Ongoing Projects */}
            <section className="py-8 relative overflow-hidden w-full max-w-full">
              {/* Gradient orbs for Client Ongoing Projects */}
              <div className="absolute top-1/2 left-1/4 w-[18rem] h-[18rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.18)_0%,_transparent_70%)] -translate-y-1/2" />
              <div className="absolute top-1/2 right-1/4 w-[16rem] h-[16rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.16)_0%,_transparent_70%)] -translate-y-1/2" />
              
              <div className="container mx-auto px-8 lg:px-12">
                <h2 className="text-2xl font-bold mb-6">Active Projects</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {clientData.ongoingProjects.map((project) => (
                    <div key={project.id} className="card-floating p-6">
                      <h3 className="text-lg font-semibold mb-2">{project.title}</h3>
                      <p className="text-muted-foreground mb-4">Freelancer: {project.freelancer}</p>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{project.progress}%</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-success h-2 rounded-full transition-all"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            Due: {project.deadline}
                          </span>
                          <span className="font-semibold text-gradient-green">{project.budget}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Client Completed Projects */}
            <section className="py-8 relative overflow-hidden w-full max-w-full">
              {/* Gradient orbs for Client Completed Projects */}
              <div className="absolute top-1/2 left-[-6rem] w-[14rem] h-[14rem] bg-[radial-gradient(circle,_rgba(249,115,22,0.14)_0%,_transparent_70%)] -translate-y-1/2" />
              <div className="absolute top-1/2 right-1/4 w-[18rem] h-[18rem] bg-[radial-gradient(circle,_rgba(34,197,94,0.18)_0%,_transparent_70%)] -translate-y-1/2" />
              
              <div className="container mx-auto px-8 lg:px-12">
                <h2 className="text-2xl font-bold mb-6">Completed Projects</h2>
                <div className="space-y-4">
                  {clientData.completedProjects.map((project) => (
                    <div key={project.id} className="card-floating p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">{project.title}</h3>
                          <p className="text-muted-foreground mb-2">Freelancer: {project.freelancer}</p>
                          <p className="text-sm text-muted-foreground">Completed: {project.completedDate}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-gradient-green mb-2">{project.spent}</div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-4 h-4 ${i < project.rating ? 'text-accent fill-current' : 'text-muted-foreground'}`} 
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;