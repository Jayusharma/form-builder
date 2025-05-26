import React from 'react'
import { DropdownMenu,DropdownMenuContent,DropdownMenuItem,DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar,AvatarImage,AvatarFallback } from '@/components/ui/avatar'
import { FaUser } from 'react-icons/fa'
import { useCurrentUser } from '@/hooks/use-current-user'
import LogoutButton from './logout-button'
import { LogOut } from 'lucide-react'
function UserButton() {
    const user = useCurrentUser();
  return (
    <div>

    
    <DropdownMenu>
        
        <DropdownMenuTrigger>
            <Avatar>
                <AvatarImage src={user?.image    || ""}/>
                <AvatarFallback>
                    <FaUser/>
                </AvatarFallback>
            </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='w-40  ' align='end'>
            <LogoutButton>
                    <DropdownMenuItem>
                        <LogOut className='h-4 w-4 mr-2'/>
                        Logout
                    </DropdownMenuItem>
                
            </LogoutButton>
        </DropdownMenuContent>
    </DropdownMenu>
    </div>
  )
}

export default UserButton