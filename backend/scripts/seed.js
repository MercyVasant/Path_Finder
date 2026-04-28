const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Building = require('./models/Building');
const Department = require('./models/Department');
const Faculty = require('./models/Faculty');
const Classroom = require('./models/Classroom');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

// --- Data extracted directly from your provided files ---
const coordinatesData = {
    "0": "23.03467899639271,72.54677427247354", "1": "23.034960346252305,72.54814340483861",
    "2": "23.03344543657921,72.54836182674394", "3": "23.034264015234534,72.54711695997935",
    "4": "23.034194901159534,72.54655369609301", "5": "23.03365520322358,72.5470120466143",
    "6": "23.033504660363132,72.54606386883316", "7": "23.033903045055563,72.54497550212473",
    "8": "23.032659606539077,72.54554369637746", "9": "23.032114848583404,72.5447544355982",
    "10": "23.033121264085594,72.54520257519019", computer_dept: "23.033786487930065,72.54848227912254",
    canteen: "23.03271945126381,72.54669265935627", anexee_building: "23.033042706060158,72.54499089749079",
    chemical_dept: "23.033937231994976,72.54495416874478", civil_dept: "23.035429239465817,72.54665522715939",
    ec_dept: "23.03411301559614,72.5450098818308", civil_lawn: "23.037053016179065,72.54666832529452",
    vishwakarma_hall: "23.036113833164507,72.54823872528254", applied_mechanics: "23.033504660363132,72.54606386883316",
    ic_dept: "23.03530266705575,72.54775796391216", textile_dept: "23.032659606539077,72.54554369637746",
    cricket_ground: "23.03494520038056,72.54531515756122", civil_drawing_hall: "23.034264015234534,72.54711695997935",
    rubber_dept: "23.03411301559614,72.5450098818308", student_store: "23.035545435693354,72.54701709395387",
    plastic_dept: "23.03411301559614,72.5450098818308", lrc_library: "23.03578926359241,72.54745093655256",
    principle_office: "23.03384709440613,72.54659706772229", hostel_a: "23.03222977024401,72.5476614271206",
    hostel_b: "23.03203093563908,72.54615766694926", hostel_e: "23.031512154197316,72.5461990511934",
    nss_office: "23.0329919209212,72.54895300354781", rabdi_tea_stall: "23.034151552096336,72.5487040934719",
};

// Helper function to parse "lat,lng" strings into the correct GeoJSON format [lng, lat]
const parseCoords = (coordString) => {
    const [lat, lng] = coordString.split(',').map(Number);
    return [lng, lat]; // GeoJSON format is [longitude, latitude]
};

const seedDatabase = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Successfully connected to MongoDB for seeding.");

        console.log("Clearing all existing data...");
        await Faculty.deleteMany({});
        await Department.deleteMany({});
        await Building.deleteMany({});
        await Classroom.deleteMany({});
        console.log("Cleared all collections.");

        // --- Step 1: Create all Buildings ---
        console.log("Creating all buildings from your data...");
        const buildingData = [
            { key: "computer_dept", name: "Computer Department", info: "Houses the Computer Engineering and IT departments." },
            { key: "chemical_dept", name: "Chemical Engineering Department" },
            { key: "civil_dept", name: "Civil Engineering Department" },
            { key: "ec_dept", name: "EC Engineering Department" },
            { key: "applied_mechanics", name: "Applied Mechanics Department" },
            { key: "ic_dept", name: "Instrumentation & Control Department" },
            { key: "textile_dept", name: "Textile Technology Department" },
            { key: "rubber_dept", name: "Rubber Department" },
            { key: "plastic_dept", name: "Plastic Department" },
            { key: "anexee_building", name: "Anexee Building" },
            { key: "vishwakarma_hall", name: "Vishwakarma Hall" },
            { key: "civil_drawing_hall", name: "Civil Drawing Hall" },
            { key: "lrc_library", name: "LRC Library Block" },
            { key: "principle_office", name: "Principal Office", info: "Administrative center of the college." },
            { key: "student_store", name: "Student Store" },
            { key: "nss_office", name: "NSS Office" },
            { key: "canteen", name: "LD College Canteen" },
            { key: "rabdi_tea_stall", name: "Rabdi Tea Stall" },
            { key: "civil_lawn", name: "Civil Lawn" },
            { key: "cricket_ground", name: "Cricket Ground" },
            { key: "hostel_a", name: "Boys Hostel Block A" },
            { key: "hostel_b", name: "Boys Hostel Block B" },
            { key: "hostel_e", name: "Boys Hostel Block E" },
        ];

        // Add Academic Blocks 0-10
        for (let i = 0; i <= 10; i++) {
            // ✅ **CORRECTION:** Used backticks (`) for template literal and made key a string
            buildingData.push({ key: `${i}`, name: `Academic Block ${i}` });
        }

        const buildingDocs = await Building.create(
            buildingData.map(b => ({
                name: b.name,
                info: b.info || '',
                location: {
                    type: 'Point',
                    coordinates: parseCoords(coordinatesData[b.key])
                }
            }))
        );
        console.log(`${buildingDocs.length} buildings created successfully.`);
        
        // Helper to find a building's ID by its name
        const getBuildingId = (name) => buildingDocs.find(b => b.name === name)?._id;

        // --- Step 2: Create Departments and link them to buildings ---
        console.log("Creating departments...");
        const departmentData = [
            { name: "Information Technology", buildingName: "Anexee Building", hod: "Dr. Hiteishi Diwanji" },
            { name: "Computer Department", buildingName: "Computer Department", hod: "Mr. Kinnar Vaghela" },
            { name: "Chemical Engineering", buildingName: "Chemical Engineering Department", hod: "Dr. Paresh Rana" },
            { name: "Civil Engineering", buildingName: "Civil Engineering Department", hod: "Dr. Rajesh Jain" },
            { name: "EC Engineering", buildingName: "EC Engineering Department", hod: "Dr. C.H. Vithlani" },
            { name: "Applied Mechanics", buildingName: "Applied Mechanics Department", hod: "Dr. Major Chaitanya Sanghvi" },
            { name: "Instrumentation & Control", buildingName: "Instrumentation & Control Department", hod: "Dr. Manish Thakker" },
            { name: "Textile Technology", buildingName: "Textile Technology Department", hod: "Dr.Dharmendrasinh Bihola" },
            { name: "Rubber Department", buildingName: "Rubber Department", hod: "Gnanu Bhatt" },
            { name: "Plastic Department", buildingName: "Plastic Department", hod: "Miss. Bharati Basantani" },
            { name: "Electrical Engineering", buildingName: "EC Engineering Department", hod: "Dr.Chirag.S Thaker" },
            { name: "Mechanical Engineering", buildingName: "Applied Mechanics Department", hod: "Dr. Keyur Hirpara" },
            { name: "Environment Engineering", buildingName: "EC Engineering Department", hod: "Dr. Gaurang Ban" },
            { name: "Biomedical Engineering", buildingName: "EC Engineering Department", hod: "Dr. Mitul Patel" },
            { name: "Automobile Engineering", buildingName: "EC Engineering Department", hod: "Dr. Vimal Patel" },
            { name: "AIML Engineering", buildingName: "EC Engineering Department", hod: "Dr.Chirag.S Thaker" },
            { name: "Robotics and Automation Engineering", buildingName: "EC Engineering Department", hod: "Dr.Chirag.S Thaker" },
        ];
        
        const departmentDocs = await Department.create(
            departmentData.map(d => ({
                name: d.name,
                hod: d.hod || 'To Be Announced',
                building: getBuildingId(d.buildingName)
            }))
        );
        console.log(`${departmentDocs.length} departments created successfully.`);

        const getDepartmentId = (name) => departmentDocs.find(d => d.name === name)?._id;

        // --- Step 3: Create Sample Faculty ---
        console.log("Creating sample faculty...");
        await Faculty.create([
            {
                name: "Prof. Rajesh Kumar", title: "Professor", department: getDepartmentId("Computer Department"),
                office: { building: getBuildingId("Computer Department"), roomNumber: "A-101" },
                email: "rajesh.kumar@example.com", details: "Expert in Artificial Intelligence."
            },
            {
                name: "Prof. Sunita Sharma", title: "Associate Professor", department: getDepartmentId("Computer Department"),
                office: { building: getBuildingId("Computer Department"), roomNumber: "A-105" },
                email: "sunita.sharma@example.com", details: "Specializes in Cloud Computing."
            },
            {
                name: "Prof. Vijay Singh", title: "Professor", department: getDepartmentId("Applied Mechanics"),
                office: { building: getBuildingId("Applied Mechanics Department"), roomNumber: "B-201" },
                email: "vijay.singh@example.com", details: "Research in fluid dynamics."
            },
        ]);
        console.log("Sample faculty created.");

        console.log("\nDatabase seeded successfully with all your data!");

    } catch (error) {
        console.error("Error seeding database:", error);
    } finally {
        mongoose.connection.close();
    }
};

seedDatabase();