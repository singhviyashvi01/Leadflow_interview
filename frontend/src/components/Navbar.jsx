import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/logo.png';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <motion.nav 
      className="py-6 bg-transparent relative z-50"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="container mx-auto px-5 flex justify-between items-center">
        {/* <Link to="/" className="flex items-center gap-2.5 font-sans font-extrabold text-2xl text-black">
          <div className="w-6 h-6 bg-black rounded" /> */}
         <Link to="/" className="flex items-center gap-2 font-sans font-extrabold text-2xl text-black">
          {/* <div className="w-6 h-6 bg-black rounded" /> */}
          <img
              src={"logo.png"}
              alt="LeadFlow Logo"
             className="w-15 h-10 object-contain"
            />
          <span>LeadFlow</span>
        </Link>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <ul className="flex gap-8">
            <li><a href="#overview" className="font-medium text-muted hover:text-primary text-sm transition-colors">Overview</a></li>
            <li><a href="#support" className="font-medium text-muted hover:text-primary text-sm transition-colors">Support</a></li>
          </ul>
          <div className="flex gap-4">
            <Link to="/login" className="bg-primary/10 text-primary px-5 py-2 rounded-lg hover:bg-primary/20 transition-all text-sm font-semibold shadow-sm border border-primary/20">Log In</Link>
            <Link to="/signup" className="bg-primary text-white px-5 py-2 rounded-lg hover:bg-[#0a3d37] transition-all text-sm font-semibold shadow-sm">Sign Up</Link>
          </div>
        </div>

        {/* Mobile Hamburger Button */}
        <button 
          className="md:hidden p-2 text-black transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            className="md:hidden absolute top-full left-0 w-full bg-white shadow-xl border-b border-gray-100 p-5 flex flex-col gap-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <ul className="flex flex-col gap-4">
              <li><a href="#overview" onClick={() => setIsMenuOpen(false)} className="block font-medium text-muted hover:text-primary transition-colors text-lg">Overview</a></li>
              <li><a href="#plans" onClick={() => setIsMenuOpen(false)} className="block font-medium text-muted hover:text-primary transition-colors text-lg">Plans</a></li>
              <li><a href="#support" onClick={() => setIsMenuOpen(false)} className="block font-medium text-muted hover:text-primary transition-colors text-lg">Support</a></li>
            </ul>
            <div className="flex flex-col gap-3 pt-4 border-t border-gray-50">
              <Link to="/login" className="w-full bg-primary/10 text-primary px-5 py-3 rounded-xl hover:bg-primary/20 transition-all text-center font-bold">Log In</Link>
              <Link to="/signup" className="w-full bg-primary text-white px-5 py-3 rounded-xl hover:bg-[#0a3d37] transition-all text-center font-bold shadow-lg shadow-primary/10">Sign Up</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
