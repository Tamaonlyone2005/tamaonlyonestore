
import React, { useState } from 'react';
import { StorageService } from '../services/storageService';
import { ServiceRequest } from '../types';
import { useToast } from '../components/Toast';
import { Briefcase, Code, PenTool, Bot, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Services: React.FC = () => {
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        contact: '',
        serviceType: 'Web Development',
        budget: '',
        description: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const req: ServiceRequest = {
            id: Date.now().toString(),
            name: formData.name,
            contact: formData.contact,
            serviceType: formData.serviceType,
            budget: formData.budget,
            description: formData.description,
            status: 'OPEN',
            createdAt: new Date().toISOString()
        };
        StorageService.createServiceRequest(req);
        addToast("Service request sent! We will contact you shortly.", "success");
        setFormData({ name: '', contact: '', serviceType: 'Web Development', budget: '', description: '' });
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-bold text-white mb-4">Hire Me</h1>
                <p className="text-gray-400 text-lg">Bring your ideas to life with professional development and design services.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-6">Services Offered</h2>
                    <div className="space-y-6">
                        <div className="bg-dark-card p-6 rounded-2xl border border-white/5 hover:border-brand-500/30 transition-all">
                            <div className="bg-blue-500/10 w-12 h-12 rounded-lg flex items-center justify-center text-blue-400 mb-4"><Code size={24}/></div>
                            <h3 className="font-bold text-white text-lg">Web Development</h3>
                            <p className="text-gray-400 text-sm mt-2">Full-stack websites, landing pages, and web applications using modern technologies.</p>
                        </div>
                        <div className="bg-dark-card p-6 rounded-2xl border border-white/5 hover:border-brand-500/30 transition-all">
                            <div className="bg-purple-500/10 w-12 h-12 rounded-lg flex items-center justify-center text-purple-400 mb-4"><PenTool size={24}/></div>
                            <h3 className="font-bold text-white text-lg">UI/UX Design</h3>
                            <p className="text-gray-400 text-sm mt-2">Modern, user-friendly, and aesthetic interface designs for web and mobile.</p>
                        </div>
                        <div className="bg-dark-card p-6 rounded-2xl border border-white/5 hover:border-brand-500/30 transition-all">
                            <div className="bg-green-500/10 w-12 h-12 rounded-lg flex items-center justify-center text-green-400 mb-4"><Bot size={24}/></div>
                            <h3 className="font-bold text-white text-lg">Bot Development</h3>
                            <p className="text-gray-400 text-sm mt-2">Automation scripts, Discord bots, and Telegram bots.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-dark-card p-8 rounded-3xl border border-white/5 shadow-xl">
                    <h2 className="text-xl font-bold text-white mb-6">Start a Project</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Your Name</label>
                            <input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full bg-dark-bg border border-white/10 rounded-xl p-3 text-white"/>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Contact (WhatsApp/Email)</label>
                            <input required value={formData.contact} onChange={e=>setFormData({...formData, contact: e.target.value})} className="w-full bg-dark-bg border border-white/10 rounded-xl p-3 text-white"/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Service Type</label>
                                <select value={formData.serviceType} onChange={e=>setFormData({...formData, serviceType: e.target.value})} className="w-full bg-dark-bg border border-white/10 rounded-xl p-3 text-white">
                                    <option>Web Development</option>
                                    <option>UI/UX Design</option>
                                    <option>Bot Development</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Budget Range</label>
                                <input placeholder="e.g. $100 - $500" value={formData.budget} onChange={e=>setFormData({...formData, budget: e.target.value})} className="w-full bg-dark-bg border border-white/10 rounded-xl p-3 text-white"/>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Project Details</label>
                            <textarea required rows={4} value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} className="w-full bg-dark-bg border border-white/10 rounded-xl p-3 text-white" placeholder="Describe your project..."/>
                        </div>
                        <button type="submit" className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-brand-500/20">Send Request</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Services;
