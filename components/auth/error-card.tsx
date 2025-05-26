import { BackButton } from "@/components/auth/BackButton";

import{
    Card,
    CardFooter,
    CardHeader
} from "@/components/ui/card"


export default function Errorcard (){
    return(
<Card className="p-5 w-[400px] shadow-md gap-20">
    <CardHeader className="flex justify-center w-full">
        <p className="flex justify-center text-2xl">Somethong went wrong</p>
    </CardHeader>
    <CardFooter>
        <BackButton href="/auth/login" label="Back to login"/>
    </CardFooter>
</Card>
    );
}