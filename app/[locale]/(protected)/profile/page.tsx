import React from 'react'
import { CurrentUser } from '@/lib/auth'
import UserInfo from '@/components/user-info';

async function Page() {
  const user = await CurrentUser();
  return (
    <div className='flex justify-center items-center w-full mt-20'>
      <UserInfo user={user} label='Profile'/>
    </div>
  )
}

export default Page