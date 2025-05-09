const bcrypt = require('bcryptjs');


exports.populateDefaultAdmin = async (db) => {
    try {
        // Check if admin already exists
        const adminExists = db.prepare(`
            SELECT id FROM staff WHERE email = ?
        `).get('admin@pelet.com');

        if (adminExists) {
            console.log('Default admin account already exists');
            return;
        }

        // Hash the default password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        // Insert default admin
        const { lastInsertRowid } = db.prepare(`
            INSERT INTO staff (
                name, 
                role, 
                email, 
                phone, 
                status, 
                password,
                created_at,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).run(
            'System Administrator',
            'Administrator',
            'admin@pelet.com',
            '090897989898',
            'active',
            hashedPassword,
        );

        console.log(`Default admin account created with ID: ${lastInsertRowid}`);

    } catch (error) {
        console.error('Error creating default admin account:', error);
        // throw new CustomError('Failed to create default admin account', 500);
    }
};

// exports.testData = {
//     "Laboratory Services": [
//         "Full Blood Count (FBC)",
//         "Blood Sugar (Fasting/Random)",
//         "HbA1c (Glycated Hemoglobin)",
//         "Malaria Parasite Test",
//         "Widal Test",
//         "Urinalysis",
//         "Urine Culture",
//         "Pregnancy Test (Urine/Serum)",
//         "Hepatitis B Surface Antigen (HBsAg)",
//         "Hepatitis C Antibody",
//         "HIV I & II Test",
//         "VDRL (Syphilis Test)",
//         "Lipid Profile",
//         "Liver Function Test (LFT)",
//         "Kidney Function Test (KFT)",
//         "Electrolytes and Urea",
//         "CRP (C-Reactive Protein)",
//         "ESR (Erythrocyte Sedimentation Rate)",
//         "Blood Group & Genotype",
//         "Thyroid Function Test (T3, T4, TSH)",
//         "Semen Analysis",
//         "PSA (Prostate Specific Antigen)",
//         "Vitamin D Test",
//         "Calcium Test",
//         "Iron Studies",
//         "Stool Microscopy/Culture"
//     ],
//     "Radiography / X-Ray": [
//         "Chest X-Ray",
//         "Abdominal X-Ray",
//         "Pelvic X-Ray",
//         "Skull X-Ray",
//         "Spine X-Ray",
//         "Limb X-Ray",
//         "Cervical Spine X-Ray",
//         "Sinus X-Ray"
//     ],
//     "ECG Services": [
//         "Resting ECG",
//         "Exercise ECG (Stress Test)",
//         "ECG Report Interpretation"
//     ],
//     "Ultrasound Scan": [
//         "Abdominal Ultrasound",
//         "Pelvic Ultrasound",
//         "Obstetric (Pregnancy) Scan",
//         "Breast Ultrasound",
//         "Thyroid Ultrasound",
//         "Scrotal/Testicular Scan",
//         "Transvaginal Ultrasound",
//         "Transrectal Ultrasound",
//         "Renal Ultrasound",
//         "Vascular Doppler Ultrasound"
//     ],
//     "Mammography": [
//         "Bilateral Mammogram",
//         "Single Breast Mammogram"
//     ],
//     "Other Imaging": [
//         "CT Scan (Head, Chest, Abdomen)",
//         "MRI Scan (Brain, Spine, Joints)",
//         "Bone Densitometry (DEXA)"
//     ]
// };

exports.testData = [
    {
        id: 'lab',
        name: 'Laboratory Services',
        tests: [
            { id: 'fbc', name: 'Full Blood Count (FBC)', price: 5000, duration: '24h' },
            { id: 'blood-sugar', name: 'Blood Sugar (Fasting/Random)', price: 2500, duration: '6h' },
            { id: 'hba1c', name: 'HbA1c (Glycated Hemoglobin)', price: 4500, duration: '12h' },
            { id: 'malaria', name: 'Malaria Parasite Test', price: 3000, duration: '4h' },
            { id: 'widal', name: 'Widal Test', price: 2500, duration: '6h' },
            { id: 'urinalysis', name: 'Urinalysis', price: 2000, duration: '3h' },
            { id: 'urine-culture', name: 'Urine Culture', price: 3500, duration: '24h' },
            { id: 'pregnancy', name: 'Pregnancy Test (Urine/Serum)', price: 2500, duration: '4h' },
            { id: 'hbsag', name: 'Hepatitis B Surface Antigen (HBsAg)', price: 4000, duration: '6h' },
            { id: 'hcv', name: 'Hepatitis C Antibody', price: 4000, duration: '6h' },
            { id: 'hiv', name: 'HIV I & II Test', price: 4000, duration: '6h' },
            { id: 'vdrl', name: 'VDRL (Syphilis Test)', price: 3000, duration: '6h' },
            { id: 'lipid-profile', name: 'Lipid Profile', price: 6000, duration: '12h' },
            { id: 'lft', name: 'Liver Function Test (LFT)', price: 5500, duration: '10h' },
            { id: 'kft', name: 'Kidney Function Test (KFT)', price: 5500, duration: '10h' },
            { id: 'electrolytes', name: 'Electrolytes and Urea', price: 5000, duration: '8h' },
            { id: 'crp', name: 'CRP (C-Reactive Protein)', price: 4000, duration: '8h' },
            { id: 'esr', name: 'ESR (Erythrocyte Sedimentation Rate)', price: 3000, duration: '6h' },
            { id: 'blood-group', name: 'Blood Group & Genotype', price: 3000, duration: '6h' },
            { id: 'thyroid', name: 'Thyroid Function Test (T3, T4, TSH)', price: 7000, duration: '24h' },
            { id: 'semen', name: 'Semen Analysis', price: 5000, duration: '24h' },
            { id: 'psa', name: 'PSA (Prostate Specific Antigen)', price: 6000, duration: '12h' },
            { id: 'vitamin-d', name: 'Vitamin D Test', price: 6500, duration: '24h' },
            { id: 'calcium', name: 'Calcium Test', price: 3000, duration: '6h' },
            { id: 'iron', name: 'Iron Studies', price: 7000, duration: '24h' },
            { id: 'stool', name: 'Stool Microscopy/Culture', price: 3500, duration: '24h' }
        ]
    },
    {
        id: 'radiography',
        name: 'Radiography/X-Ray',
        tests: [
            { id: 'chest-xray', name: 'Chest X-Ray', price: 8000, duration: '1h' },
            { id: 'abdominal-xray', name: 'Abdominal X-Ray', price: 10000, duration: '1h' },
            { id: 'pelvic-xray', name: 'Pelvic X-Ray', price: 9000, duration: '1h' },
            { id: 'skull-xray', name: 'Skull X-Ray', price: 9500, duration: '1h' },
            { id: 'spine-xray', name: 'Spine X-Ray', price: 9500, duration: '1h' },
            { id: 'limb-xray', name: 'Limb X-Ray', price: 8500, duration: '1h' },
            { id: 'cervical-xray', name: 'Cervical Spine X-Ray', price: 9500, duration: '1h' },
            { id: 'sinus-xray', name: 'Sinus X-Ray', price: 8500, duration: '1h' }
        ]
    },
    {
        id: 'ecg',
        name: 'ECG Services',
        tests: [
            { id: 'resting-ecg', name: 'Resting ECG', price: 7000, duration: '30m' },
            { id: 'exercise-ecg', name: 'Exercise ECG (Stress Test)', price: 12000, duration: '1h' },
            { id: 'ecg-interpretation', name: 'ECG Report Interpretation', price: 3000, duration: '1h' }
        ]
    },
    {
        id: 'ultrasound',
        name: 'Ultrasound Scan',
        tests: [
            { id: 'abdominal-ultrasound', name: 'Abdominal Ultrasound', price: 10000, duration: '1h' },
            { id: 'pelvic-ultrasound', name: 'Pelvic Ultrasound', price: 9500, duration: '1h' },
            { id: 'obstetric-scan', name: 'Obstetric (Pregnancy) Scan', price: 9000, duration: '1h' },
            { id: 'breast-ultrasound', name: 'Breast Ultrasound', price: 9000, duration: '1h' },
            { id: 'thyroid-ultrasound', name: 'Thyroid Ultrasound', price: 9500, duration: '1h' },
            { id: 'scrotal-scan', name: 'Scrotal/Testicular Scan', price: 9500, duration: '1h' },
            { id: 'transvaginal-scan', name: 'Transvaginal Ultrasound', price: 11000, duration: '1h' },
            { id: 'transrectal-scan', name: 'Transrectal Ultrasound', price: 11000, duration: '1h' },
            { id: 'renal-ultrasound', name: 'Renal Ultrasound', price: 9500, duration: '1h' },
            { id: 'vascular-doppler', name: 'Vascular Doppler Ultrasound', price: 13000, duration: '1.5h' }
        ]
    },
    {
        id: 'mammography',
        name: 'Mammography',
        tests: [
            { id: 'bilateral-mammogram', name: 'Bilateral Mammogram', price: 12000, duration: '1h' },
            { id: 'single-mammogram', name: 'Single Breast Mammogram', price: 7000, duration: '1h' }
        ]
    },
    {
        id: 'other-imaging',
        name: 'Other Imaging',
        tests: [
            { id: 'ct-scan', name: 'CT Scan (Head, Chest, Abdomen)', price: 35000, duration: '2h' },
            { id: 'mri-scan', name: 'MRI Scan (Brain, Spine, Joints)', price: 45000, duration: '2h' },
            { id: 'bone-densitometry', name: 'Bone Densitometry (DEXA)', price: 18000, duration: '1.5h' }
        ]
    }
];
