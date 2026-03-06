
import React from 'react';

interface PolicyPageProps {
    title: string;
    children?: React.ReactNode;
    contentHtml?: string;
}

const PolicyPage: React.FC<PolicyPageProps> = ({ title, children, contentHtml }) => {
    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-center mb-8">{title}</h1>
            <div className="bg-white/5 backdrop-filter backdrop-blur-lg border border-white/20 rounded-2xl p-8 space-y-6 text-gray-300 leading-loose prose prose-invert prose-p:text-gray-300 prose-headings:text-amber-400">
                {contentHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
                ) : (
                    children || <p className="text-gray-500">لا يوجد محتوى منشور بعد.</p>
                )}
            </div>
        </div>
    );
};

export default PolicyPage;
