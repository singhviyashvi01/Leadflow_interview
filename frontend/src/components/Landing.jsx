import React from 'react';
import Navbar from './Navbar';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import teamIllustration from '../assets/teamillustration.png';

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
};

const staggerContainer = {
  initial: {},
  whileInView: {
    transition: {
      staggerChildren: 0.15
    }
  },
  viewport: { once: true }
};

const Hero = () => (
  <motion.section 
    className="text-center py-16 md:py-24 px-5"
    initial="initial"
    animate="whileInView"
    variants={staggerContainer}
  >
    <div className="container mx-auto">
      <motion.h1 
        className="text-4xl md:text-6xl text-primary mb-6 tracking-tight leading-tight"
        variants={fadeInUp}
      >
        Empower Your Sales Team <br className="hidden md:block" /> to New Heights
      </motion.h1>
      <motion.p 
        className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed font-sans"
        variants={fadeInUp}
      >
        Streamline your pipeline, automate follow-ups, and close deals faster with our intuitive sales management platform.
      </motion.p>
      <motion.div 
        className="flex flex-col sm:flex-row justify-center gap-4 font-sans font-semibold"
        variants={fadeInUp}
      >
        <Link to="/signup" className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-[#0a3d37] transition-all hover:-translate-y-0.5 shadow-sm text-center">
          Get Started
        </Link>
        <Link to="/login" className="bg-white/60 text-primary px-8 py-3 rounded-lg border border-primary/10 hover:bg-white/80 transition-all hover:-translate-y-0.5 shadow-sm text-center">
          Log In
        </Link>
      </motion.div>
    </div>
  </motion.section>
);

const Features = () => {
  const features = [
    {
      title: 'Pipeline Tracking',
      description: 'Monitor every stage of your sales funnel with ease. Drag and drop deals across custom stages.',
      icon: <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
    },
    {
      title: 'Advanced Analytics',
      description: 'Gain deep insights with automated data reporting. Real-time metrics on conversion and velocity.',
      icon: <path d="M12 20V10M18 20V4M6 20v-4" />
    },
    {
      title: 'Team Collaboration',
      description: 'Work together seamlessly with shared deal boards. Assign tasks and mention team members.',
      icon: (
        <>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </>
      )
    }
  ];

  return (
    <section className="py-20 px-5" id="overview">
      {/* <div className="container mx-auto text-center"> */}
      <div className="max-w-6xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl text-primary mb-3">Core App Functionalities</h2>
          <p className="text-muted text-lg mb-12 font-sans font-medium">Everything you need to manage your sales process effectively in one place.</p>
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={staggerContainer}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div 
              key={index} 
              className="bg-white/40 p-8 rounded-xl border border-primary/10 text-left transition-all hover:bg-white/60 hover:-translate-y-1.5 hover:shadow-xl group"
              variants={fadeInUp}
            >
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-6 text-primary shadow-sm group-hover:shadow-md transition-shadow">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {feature.icon}
                </svg>
              </div>
              <h3 className="text-2xl mb-4 text-primary">{feature.title}</h3>
              <p className="text-muted font-sans leading-relaxed text-sm lg:text-base">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const ModernTeams = () => {
  const checkIcon = (
    <div className="w-5 h-5 border-2 border-primary rounded-full flex items-center justify-center p-0.5 shrink-0 text-primary">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
  );

  return (
    <section className="py-24 px-5 overflow-hidden">
      {/* <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-12 lg:gap-20"> */}
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-12 lg:gap-24">
        <motion.div 
          className="text-center lg:text-left"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h2 className="text-4xl md:text-5xl mb-10">Built for Modern <br className="hidden lg:block" /> Sales Teams</h2>
          <ul className="space-y-6 max-w-lg mx-auto lg:mx-0">
            {[
              { label: 'Intuitive UI', desc: 'Zero learning curve with our clean design.' },
              { label: 'Real-time Sync', desc: 'Stay updated across all devices instantly.' },
              { label: 'Secure Data', desc: 'Enterprise-grade security for your data.' }
            ].map((item, i) => (
              <li key={i} className="flex gap-4 text-left">
                {checkIcon}
                <div className="font-sans">
                  <strong className="block text-lg font-bold">{item.label}</strong>
                  <p className="text-muted text-sm">{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>
        
        <motion.div 
          className="bg-white/40 p-6 md:p-10 lg:p-14 rounded-3xl flex justify-center items-center"
          initial={{ opacity: 0, x: 50, rotate: 2 }}
          whileInView={{ opacity: 1, x: 0, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* <div className="bg-white p-8 lg:p-10 rounded-2xl shadow-2xl shadow-black/5">
            <div className="grid grid-cols-2 gap-5">
              {[1, 2, 3, 4].map(i => (
                <motion.div 
                  key={i} 
                  className="w-20 lg:w-24 h-20 lg:h-24 border border-primary/10 rounded-full flex items-center justify-center text-gray-300"
                  whileHover={{ scale: 1.1, borderColor: "rgba(0,0,0,0.2)" }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </motion.div>
              ))}
            </div>
          </div> */}
                    
          <div className="bg-white p-4 rounded-2xl shadow-2xl shadow-black/5">
  <img
    src={teamIllustration}
    alt="Sales team collaboration"
    className="w-full max-w-md object-contain rounded-xl mx-auto"
  />
</div>
        </motion.div>
      </div>
    </section>
  );
};

const Footer = () => (
  <footer className="py-10 border-t border-primary/10">
    <div className="container mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-5 text-sm">
      <div className="flex items-center gap-2 font-sans font-extrabold text-lg text-black">
        {/* <div className="w-5 h-5 bg-black rounded" /> */}
        <img
           src={"logo.png"}
           alt="LeadFlow Logo"
          className="w-8 h-8 object-contain -mr-1"
          />
        <span>LeadFlow</span>
      </div>
      <ul className="flex gap-6 text-muted font-sans font-medium">
        <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
        <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
        <li><a href="#" className="hover:text-primary transition-colors">Cookie Policy</a></li>
        <li><a href="#" className="hover:text-primary transition-colors">Support</a></li>
      </ul>
      <p className="text-muted font-sans">© 2026 LeadFlow Inc. All rights reserved.</p>
    </div>
  </footer>
);

const Landing = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <ModernTeams />
      <Footer />
    </div>
  );
};

export default Landing;
