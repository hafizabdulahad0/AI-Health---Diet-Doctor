import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { calculateBMI, getBMIStatus, calculateTargetWeight } from "@/utils/helpers";
import { DailyRecord } from "@/types";
import { MessageCircle } from "lucide-react";
export default function DashboardPage() {
  const {
    profile
  } = useAuth();
  const {
    toast
  } = useToast();
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [dayNumber, setDayNumber] = useState(1);
  const [newWeight, setNewWeight] = useState("");
  const [exerciseDone, setExerciseDone] = useState(false);
  const [dietFollowed, setDietFollowed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    // Load records from localStorage
    if (profile) {
      const storedRecords = localStorage.getItem(`health_app_records_${profile.userId}`);
      if (storedRecords) {
        setRecords(JSON.parse(storedRecords));
      }

      // Set default new weight to current weight
      setNewWeight(profile.weight.toString());
    }
  }, [profile]);
  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsLoading(true);

    // Create a new record
    const newRecord: DailyRecord = {
      id: Date.now().toString(),
      userId: profile.userId,
      date: new Date().toISOString().split('T')[0],
      dayNumber: dayNumber,
      exercise: exerciseDone,
      dietFollowed: dietFollowed,
      newWeight: parseFloat(newWeight),
      createdAt: new Date().toISOString()
    };

    // Add to records
    const updatedRecords = [newRecord, ...records];
    setRecords(updatedRecords);

    // Save to localStorage
    localStorage.setItem(`health_app_records_${profile.userId}`, JSON.stringify(updatedRecords));

    // Reset form
    setExerciseDone(false);
    setDietFollowed(false);
    setIsLoading(false);
  };
  const handleExportRecords = () => {
    if (!records || records.length === 0) {
      toast({
        title: "No records to export",
        description: "You don't have any records to export yet.",
        variant: "destructive"
      });
      return;
    }

    // Create CSV content
    const headers = ["Date", "Day Number", "Exercise Done", "Diet Followed", "Weight (kg)"];
    const csvContent = [headers.join(","), ...records.map(record => {
      return [record.date, record.dayNumber, record.exercise ? "Yes" : "No", record.dietFollowed ? "Yes" : "No", record.newWeight].join(",");
    })].join("\n");

    // Create a blob and download link
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "health_records.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: "Export Successful",
      description: "Your health records have been exported as a CSV file."
    });
  };
  if (!profile) return <div>Loading...</div>;
  const bmi = calculateBMI(profile.weight, profile.height);
  const bmiStatus = getBMIStatus(bmi);
  const targetWeight = calculateTargetWeight(profile.height, profile.weight);

  // Calculate BMI progress percentage (18.5-30 is the typical range)
  const bmiProgressPercent = () => {
    if (bmi < 18.5) return bmi / 18.5 * 50; // 0-50% for underweight
    if (bmi <= 25) return 50 + (bmi - 18.5) / (25 - 18.5) * 25; // 50-75% for healthy
    if (bmi <= 30) return 75 + (bmi - 25) / (30 - 25) * 15; // 75-90% for overweight
    return 90 + Math.min((bmi - 30) / 10 * 10, 10); // 90-100% for obese
  };
  return <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Welcome, {profile.name}!</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">BMI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{bmi}</div>
            <p className="text-muted-foreground">{bmiStatus}</p>
            <Progress value={bmiProgressPercent()} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Current Weight</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{profile.weight} kg</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Height</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{profile.height} cm</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Target Weight</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{targetWeight} kg</div>
            <p className="text-muted-foreground">Healthy BMI range</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
        <Link to="/meal-plan" className="block">
          <Button variant="outline" size="lg" className="w-full h-20 text-lg">
            7-Day Diet Plan
          </Button>
        </Link>
        
        <Link to="/exercise-plan" className="block">
          <Button variant="outline" size="lg" className="w-full h-20 text-lg">
            7-Day Exercise Plan
          </Button>
        </Link>
        
        <Link to="/food-analysis" className="block">
          <Button variant="outline" size="lg" className="w-full h-20 text-lg">
            Food Analysis
          </Button>
        </Link>
        
        <Link to="/chat" className="block">
          <Button variant="outline" size="lg" className="w-full h-20 text-lg">
            <MessageCircle className="mr-2" />
            Chat Now
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Update Daily Record</CardTitle>
          </CardHeader>
          <CardContent className="bg-inherit">
            <form onSubmit={handleAddRecord} className="space-y-4">
              <div>
                <label className="block mb-1">Day Number</label>
                <input type="number" min="1" max="30" value={dayNumber} onChange={e => setDayNumber(parseInt(e.target.value))} required className="w-full p-2 border rounded bg-inherit" />
              </div>
              
              <div className="flex items-center">
                <input type="checkbox" id="exercise" checked={exerciseDone} onChange={e => setExerciseDone(e.target.checked)} className="mr-2" />
                <label htmlFor="exercise">Exercise Done?</label>
              </div>
              
              <div className="flex items-center">
                <input type="checkbox" id="diet" checked={dietFollowed} onChange={e => setDietFollowed(e.target.checked)} className="mr-2" />
                <label htmlFor="diet">Diet Followed?</label>
              </div>
              
              <div>
                <label className="block mb-1">Today's Weight (kg)</label>
                <input type="number" step="0.1" value={newWeight} onChange={e => setNewWeight(e.target.value)} required className="w-full p-2 border rounded bg-inherit" />
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Record"}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Daily Records</CardTitle>
            <Button variant="outline" size="sm" onClick={handleExportRecords}>Export Records</Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted">
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Day</th>
                    <th className="p-2 text-left">Exercise</th>
                    <th className="p-2 text-left">Diet</th>
                    <th className="p-2 text-left">Weight (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length > 0 ? records.map(record => <tr key={record.id} className="border-b">
                        <td className="p-2">{record.date}</td>
                        <td className="p-2">{record.dayNumber}</td>
                        <td className="p-2">{record.exercise ? "✓" : "✗"}</td>
                        <td className="p-2">{record.dietFollowed ? "✓" : "✗"}</td>
                        <td className="p-2">{record.newWeight}</td>
                      </tr>) : <tr>
                      <td colSpan={5} className="p-4 text-center text-muted-foreground">
                        No records found
                      </td>
                    </tr>}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
}