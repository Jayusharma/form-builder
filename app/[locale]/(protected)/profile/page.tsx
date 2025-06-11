import React from 'react'
import { CurrentUser } from '@/lib/auth'
import UserInfo from '@/components/user-info';
import { ExtendedUser } from '@/next-auth';

async function Page() {
  const user = await CurrentUser();
  if (!user) {
    return (
      <div className='flex justify-center items-center w-full mt-20'>
        <p className='text-lg'>You must be logged in to view this page.</p>
      </div>
    )
  }
  return (
    <div className='flex justify-center items-center w-full mt-20'>
      <UserInfo user={user as ExtendedUser} label='Profile'/>
    </div>
  )
}

export default Page