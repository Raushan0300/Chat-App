import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";

const Auth = () => {
    const navigate = useNavigate();
  return (
    <div className="flex flex-col justify-center items-center min-h-screen">
      <Tabs
        defaultValue="login"
        className="w-[400px]">
        <TabsList className="w-full">
          <TabsTrigger value="login" className="w-full font-bold">Login</TabsTrigger>
          <TabsTrigger value="signup" className="w-full font-bold">Signup</TabsTrigger>
        </TabsList>
        <TabsContent value="login" className="flex flex-col gap-3">
          <Input type="email" placeholder="Email" />
          <Input type="password" placeholder="Password" />
          <Button className="w-full" onClick={()=>{navigate('/chat')}}>Login</Button>
        </TabsContent>
        <TabsContent value="signup" className="flex flex-col gap-3">
          <Input type="text" placeholder="Name" />
          <Input type="email" placeholder="Email" />
          <Input type="password" placeholder="Password" />
          <Input type="password" placeholder="Confirm Password" />
          <Button className="w-full">Signup</Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Auth;
